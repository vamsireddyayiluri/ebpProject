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
  const loading = ref(false)

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
    await router.push({query: {id: chatId}})
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
      lastMessage: {
        content: '',
        timestamp: '',
      },
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
      id: uid(16),
      chatId: chatId,
      receiverId: currentParticipant.value.id,
      senderId: authStore.userData.userId,
      content,
      date: today.format('MM/DD/YYYY'),
      timestamp: formatDate.todayYesterdayDate(today),
      ...(replyMessage && { replyMessage }),
    }
    const fileUrls = []
    try {
      if (files.length > 0) {
        loading.value = true
        await Promise.all(
          files.map(async blob => {
            const file = new File([blob.blob], blob.name, { type: blob.type })
            const fileRef = await firebaseRef(storage, `chats/${chatId}/${newMessage.id}/${file.name}`)
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
      loading.value = false
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

    // subscribe on chats
    unsubscribeChats = await onSnapshot(queryByPartialId, async snapshot => {
      const arr = []
      await snapshot.docs.map(async doc => {
        arr.push(doc.data())
      })

      // messages listener
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified') {
          const chatData = change.doc.data()
          const lastMessage = chatData.messages.at(-1)
          chatData.unreadCount && handleNewMessage(lastMessage)
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
      }
      if (activeChat.value?.chatId === message.chatId && isChatPage) {
        await markAsRead(message.chatId)
      }
    }
  }
  const markUserAsOnlineOffline = async status => {
    const queryByPartialId = await query(
      collection(db, 'chats'),
      where('userIds', 'array-contains', authStore.userData.userId),
    )
    try {
      const chatsSnapshot = await getDocs(queryByPartialId)
      for (const doc of chatsSnapshot.docs) {
        const arr = doc.data().users.map(i => {
          if (i.id === authStore.userData.userId) {
            return {...i, status}
          }
          else return i
        })
        const chatRef = doc.ref
        await updateDoc(chatRef,{
          users: arr,
        })
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
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
  const downloadFileFromChat = async file => {
    const body = document.getElementsByClassName('styleChatWindow')[0]
    body.style.cursor = "progress"
    try {
      const response = await fetch(file.localUrl)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.setAttribute('download', file.name)
      link.click()
      body.style.cursor = null
    } catch (error) {
      console.error('Error downloading file:', error)
      body.style.cursor = null
    }
  }

  return {
    chats,
    activeChat,
    isNewMessage,
    loading,
    openChat,
    goToChat,
    getChats,
    sendNewMessage,
    markAsRead,
    markUserAsOnlineOffline,
    downloadFileFromChat,
  }
})
