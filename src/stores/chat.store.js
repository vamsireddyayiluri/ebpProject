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
  increment,
} from 'firebase/firestore'
import { db, storage } from '~/firebase'
import { uid } from 'uid'
import { getDownloadURL, ref as firebaseRef, list, uploadBytes } from 'firebase/storage'

export const useChatStore = defineStore('chat', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const router = useRouter()
  const formatDate = useDate()
  const chats = ref([])
  const activeChat = ref(null)

  const currentParticipant = computed(() => activeChat.value?.users?.find(i => i.id !== authStore?.userData?.userId))
  const isNewMessage = computed(() => chats.value?.some(i => i.unreadCount && i.messages.at(-1).senderId !== authStore.userData.userId))
  const today = moment()

  // check if chat exist and return id
  const checkIfExist = async userId => {
    const chatsQuery = await query(
      collection(db, 'chats'),
      where('userIds', 'array-contains', userId),
    )
    const chatDocs = await getDocs(chatsQuery)

    return chatDocs.docs[0]?.id
  }

  //open chat and mark all message as read
  const openChat = async chatId => {
    activeChat.value = chats.value.find(i => i.chatId === chatId)
    await markAsRead(chatId)
  }

  // mark all message as read
  const markAsRead = async chatId => {
    await updateDoc(doc(db, 'chats', chatId), {
      unreadCount: 0,
    })
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
    const receiverAvatar = await getUserPhoto(user.userId)
    const newChat = {
      chatId,
      users: [
        {
          id: user.userId,
          avatar: receiverAvatar,
          username: user.fullName,
          status: 'online',
        },
        {
          id: authStore.userData.userId,
          avatar: authStore.currentUser.photoURL,
          username: authStore.userData.fullName,
          status: 'online',
        },
      ],
      lastMessage: {},
      messages: [],
      unreadCount: 0,
      userIds: [authStore.userData.userId, user.userId],
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
      chatId: chatId,
      receiverId: currentParticipant.value.id,
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
            "name": file.name,
            "size": file.size,
            "type": file.type,
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
        unreadCount: increment(1),
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
      where('userIds', 'array-contains', authStore.userData.userId),
    )

    // suscribe on chats
    unsubscribeChats = await onSnapshot(queryByPartialId, async snapshot => {
      const arr = []
      await snapshot.docs.map(async doc => {
        arr.push(doc.data())
      })

      // // message listener
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified') {
          const lastMessage = change.doc.data().messages.at(-1)
          handleNewMessage(lastMessage)
        }
      })
      chats.value = arr
    })
  }

  const handleNewMessage = async message => {
    const isChatPage = router.currentRoute.value.name === 'chat'
    if (authStore.userData.userId !== message.senderId) {
      // notify if user is not on chat page
      if (!isChatPage) {
        const toasty = {
          title: 'New message',
          content: message.content,
          button: { name: 'Go to chat', callback: async () => await goToChat(message.receiverId) },
        }
        alertStore.info(toasty)
      } else {
        await markAsRead(message.chatId)
      }
    }
  }
  const getUserPhoto = async id => {
    const fileRef = await firebaseRef(storage, `avatar/${id}`)
    try {
      const filesList = await list(fileRef)
      if (filesList.items.length > 0) {
        const firstFileRef = filesList.items[0]

        return await getDownloadURL(firstFileRef)
      } else {
        return ''
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  return {
    chats,
    activeChat,
    isNewMessage,
    openChat,
    goToChat,
    getChats,
    sendNewMessage,
    markAsRead,
  }
})
