import { defineStore } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'
import { useDate } from '~/composables'
import moment from 'moment-timezone'
import { useAuthStore } from '~/stores/auth.store'
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, storage } from '~/firebase'
import { uid } from 'uid'
import { getDownloadURL, ref as firebaseRef, uploadBytes } from 'firebase/storage'

export const useChatStore = defineStore('chat', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const router = useRouter()
  const formatDate = useDate()
  const chats = ref([])
  const activeChatId = ref()
  const isNewMessage = computed(() => chats.value?.some(i => i.unreadCount))
  const today = moment()

  //check if chat exist and return id
  const checkIfExist = async userId => {
    const chatsQuery = await query(
      collection(db, 'chats'),
      where('users', 'array-contains', userId),
    )
    const chatDocs = await getDocs(chatsQuery)

    return chatDocs.docs[0].id
  }

  //open chat
  const openChat = async chatId => {
    activeChatId.value = chatId
  }

  // got to chat page and open or create chat
  const goToChat = async userId => {
    await router.push('chat')
    const chatId = await checkIfExist(userId)
    if (chatId) {
      await openChat(chatId)
    } else {
      const user = await getUserById(userId)
      await createNewChat(uid(16), user)
    }
  }
  const getUserById = async userId => {
    try {
      const docData = await getDoc(doc(db, 'users', userId))

      return docData.data()
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const createNewChat = async (chatId, user) => {
    const newChat = {
      chatId,
      user: {
        id: user.userId,
        avatar: authStore.currentUser.photoURL,
        username: `${user.fullName}`,
        status: 'online',
      },
      lastMessage: {},
      messages: [],
      unreadCount: 0,
      users: [authStore.userData.userId, user.userId],
    }
    try {
      await setDoc(doc(db, 'chats', chatId), newChat)
      await openChat(chatId)
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const sendNewMessage = async ({ content, chatId, files, replyMessage }) => {
    const newMessage = {
      id: chatId,
      senderId: authStore.userData.userId,
      content,
      date: today.format('MM/DD/YYYY'),
      timestamp: formatDate.todayYesterdayDate(today),
      isEditedMessage: false,
      ...(replyMessage && { replyMessage }),
    }

    const fileUrls = []

    try {
      await Promise.all(
        files.map(async blob => {
          const file = new File([blob.blob], blob.name, { type: blob.type })
          const fileRef = await firebaseRef(storage, `chats/${chatId}/${file.name}`)
          await uploadBytes(fileRef, file)
          const url = await getDownloadURL(fileRef)
          const fileData = {
            localUrl: url,
            name: file.name,
            size: file.size,
            type: file.type,
          }
          fileUrls.push(fileData)
        }),
      )
      if (fileUrls.length > 0) {
        newMessage.files = fileUrls
      }
      await updateDoc(doc(db, 'chats', chatId), {
        messages: arrayUnion(newMessage),
        lastMessage: {
          content: newMessage.content,
          timestamp: newMessage.timestamp,
        },
      })
    } catch (error) {
      alertStore.warning({ content: error.message })
    }
  }

  let unsubscribeChats
  const getChats = async () => {
    if (unsubscribeChats) {
      unsubscribeChats()
    }
    const queryByPartialId = await query(
      collection(db, 'chats'),
      where('users', 'array-contains', authStore.userData.userId),
    )
    unsubscribeChats = await onSnapshot(queryByPartialId, async snapshot => {
      const arr = []
      await snapshot.docs.map(async doc => {
        arr.push(doc.data())
      })
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified') {
          const isChatPage = router.currentRoute.value.name === 'chat'
          if (!isChatPage) {
            const lastMessage = change.doc.data().messages.at(-1)
            const toasty = {
              title: 'New message',
              content: lastMessage.content,
              button: { name: 'Go to chat', callback: async () => await router.push('chat') },
            }
            alertStore.info(toasty)
          }
        }
      })
      chats.value = arr
    })
  }

  return {
    chats,
    activeChatId,
    isNewMessage,
    openChat,
    goToChat,
    getChats,
    sendNewMessage,
  }
})
