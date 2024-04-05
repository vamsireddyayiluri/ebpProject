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
  where,
  increment,
  addDoc,
} from 'firebase/firestore'
import { db, storage } from '~/firebase'
import { uid } from 'uid'
import { getDownloadURL, ref as firebaseRef, list, uploadBytes } from 'firebase/storage'
import { sortBy, uniqBy } from 'lodash'
import statuses from '~/constants/statuses'

export const useChatStore = defineStore('chat', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const router = useRouter()
  const chats = ref([])
  const activeChat = ref(null)
  const loading = ref(false)
  const activeChatMessages = ref([])
  const companies = ref([])
  const users = ref([])
  let unsubscribeUsers = null

  // const currentParticipant = computed(() =>
  //   activeChat.value?.users?.find(i => i.id !== authStore?.userData?.userId),
  // )

  const currentParticipant = computed(() =>
    activeChat.value?.participants?.find(i => i !== authStore?.userData?.orgId),
  )

  // const isNewMessage = computed(() => {
  //   console.log('chats', chats)
  //   return chats.value?.some(
  //     i => i?.unreadCount && i?.messages?.at(-1)?.senderId !== authStore?.userData?.userId,
  //   )
  // })

  // check if chat exist and return id
  const checkIfExist = async chatId => {
    return chats.value.some(c => c.chatId === chatId) ? true : false
  }

  //open chat and mark all message as read
  const openChat = async chatId => {
    await router.replace({ query: { id: chatId } })
    activeChat.value = chats.value.find(i => i.chatId === chatId)
    await getMessagesBychatId(chatId)
    await getUsersBychatId(activeChat.value?.users)
  }
  const getUsersBychatId = async usersData => {
    unsubscribeUsers && unsubscribeUsers()
    users.value = []
    usersData?.map(async user => {
      if (user !== authStore.userData.user_id) {
        const avatar = (await getUserPhoto(user)) || null
        getUserById(user, avatar)
      }
    })
    const { orgId } = authStore.orgData
    const { user_id: userId, name, avatar, status } = authStore.userData
    users.value.push({
      id: userId,
      orgId,
      name,
      avatar: avatar || null,
      status: status || 'online',
    })
  }

  const getUserById = async (userId, avatar) => {
    try {
      const userRef = doc(db, 'users', userId)
      unsubscribeUsers = onSnapshot(userRef, async snapshot => {
        const data = await snapshot.data()
        const userIndex = users.value.findIndex(val => val.id === snapshot.id)
        if (userIndex !== -1) {
          users.value[userIndex].status = data.status
        } else {
          await users.value.push({
            id: userId,
            orgId: data.orgId,
            name: data.name,
            avatar: avatar || null,
            status: data.status || 'offline',
          })
        }
      })

      // await onSnapshot(doc(db, 'users', userId), async snapshot => {
      //   console.log('snapshot dta', snapshot.data())
      //   return snapshot.data()
      // })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // mark all message as read
  const markAsRead = async chatId => {
    await setDoc(
      doc(db, 'chats', chatId),
      {
        unreadCounts: { [authStore.userData.orgId]: 0 },
      },
      { merge: true },
    )
  }

  // got to chat page and open or create chat
  const goToChat = async orgId => {
    // organization Id
    await router.push('chat')
    const chatId = authStore.userData.orgId + '_' + orgId
    const exists = await checkIfExist(chatId)
    if (exists) {
      await openChat(chatId)
    } else {
      // const user = await getUserById(data.owner)
      await createNewChat(chatId, orgId)
    }
  }

  const createNewChat = async (chatId, orgId) => {
    // const receiverAvatar = await getUserPhoto(user.user_id)
    const newChat = {
      chatId,
      participants: [authStore.userData.orgId, orgId],
      unreadCounts: { [authStore.userData.orgId]: 0, [orgId]: 0 },
      lastMessage: {
        content: '',
        timestamp: '',
      },
      users: [],
      updatedAt: '',
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
      senderId: authStore.userData.user_id,
      participantId: authStore.userData.user_id,
      content,
      date: moment().format('MM/DD/YYYY'),
      timestamp: moment().format(),
      ...(replyMessage && { replyMessage }),
    }
    const fileUrls = []
    try {
      if (files.length > 0) {
        loading.value = true
        await Promise.all(
          files.map(async blob => {
            const file = new File([blob.blob], blob.name, { type: blob.type })
            const fileRef = await firebaseRef(
              storage,
              `chats/${chatId}/${newMessage.id}/${file.name}`,
            )
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
        newMessage.files = fileUrls
      }
      const chatData = {
        lastMessage: {
          content: newMessage.content,
          timestamp: moment().format(),
        },
        unreadCounts: { [currentParticipant.value]: increment(1) },
        updatedAt: moment().format(),
      }
      const { users } = chats.value.find(c => c.chatId === chatId)
      if (!users.includes(authStore.userData.user_id)) {
        chatData.users = arrayUnion(authStore.userData.user_id)
      }
      const chatDocRef = doc(db, 'chats', chatId)
      await setDoc(chatDocRef, chatData, { merge: true })
      const messageRef = collection(chatDocRef, 'messages')
      await addDoc(messageRef, { ...newMessage })
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
    try {
      loading.value = true
      const queryByPartialId = await query(
        collection(db, 'chats'),
        where('participants', 'array-contains', authStore.userData.orgId),
      )

      // subscribe on chats
      unsubscribeChats = await onSnapshot(queryByPartialId, async snapshot => {
        const arr = []
        companies.value = []
        await snapshot.docs.map(async doc => {
          const array = doc.data()
          array.participants?.map(async orgId => {
            if (orgId !== authStore.orgData.orgId) {
              const { company = null } = await getOrgData(orgId)
              companies.value.push({ company: company, orgId: orgId })
            }
          })
          arr.push(array)
        })
        const { company, orgId } = authStore.orgData
        companies.value.push({ company, orgId })

        snapshot.docChanges().forEach(change => {
          if (change.type === 'modified') {
            const chatData = change.doc.data()
            const user = chatData.participants.find(val => val !== authStore.userData.orgId)
            chatData.unreadCounts[user] && handleNewMessage()
          }
        })

        // messages listener
        // snapshot.docChanges().forEach(change => {
        //   if (change.type === 'modified') {
        //     const chatData = change.doc.data()
        //     const lastMessage = chatData.messages.at(-1)
        //     chatData.unreadCount && handleNewMessage(lastMessage)
        //   }
        // })
        chats.value = arr
      })
      loading.value = false
    } catch (error) {
      console.log('error', error)
    }
  }
  const getOrgData = async orgId => {
    const docData = await getDoc(doc(db, 'organizations', orgId))

    return docData.data()
  }

  const getMessagesBychatId = async chatId => {
    loading.value = true
    activeChatMessages.value = []
    const messageRef = collection(db, 'chats', chatId, 'messages')
    await onSnapshot(messageRef, async snapshot => {
      if (activeChat.value?.chatId === chatId) {
        const test = await snapshot.docs.map(doc => doc.data())
        activeChatMessages.value = sortBy(test, 'timestamp')
        await markAsRead(chatId)
      }
      loading.value = false
    })
  }

  const handleNewMessage = async message => {
    const isChatPage = router.currentRoute.value.name === 'chat'

    // if (authStore.userData.userId !== message.senderId) {
    // notify if user is not on chat page
    if (!isChatPage) {
      const toasty = {
        title: 'New message',
        content: 'new message arrived',
        button: { name: 'Go to chat', callback: async () => await goToChat(message.receiverId) },
      }
      alertStore.info(toasty)

      // }
      if (activeChat.value?.chatId === message.chatId && isChatPage) {
        await markAsRead(message.chatId)
      }
    }
  }
  const markUserAsOnlineOffline = async status => {
    try {
      await authStore.updateUserDoc({ status })
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
    body.style.cursor = 'progress'
    try {
      const response = await fetch(file.localUrl)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.setAttribute('download', file.name)
      link.click()
      body.style.cursor = null
    } catch (error) {
      body.style.cursor = null
    }
  }

  const getCommittedTruckerOrgs = async () => {
    const qFiltered = query(
      collection(db, 'commitments'),
      where('orgId', '==', authStore.userData?.orgId),
    )
    const querySnapshot = await getDocs(qFiltered)
    const allTruckers = []
    querySnapshot.docs.forEach(doc => {
      const approvedTrucker = doc.data().timeLine?.some(({ status }) => status === 'approved')

      if (approvedTrucker) {
        const { truckerOrgId: id, truckerCompany: name } = doc.data()

        allTruckers.push({ id, name })
      }
    })
    const committedTruckers = uniqBy(allTruckers, 'id')
    return committedTruckers
  }

  return {
    chats,
    activeChat,
    loading,
    activeChatMessages,
    companies,
    users,
    openChat,
    goToChat,
    getChats,
    sendNewMessage,
    markAsRead,
    markUserAsOnlineOffline,
    downloadFileFromChat,
    getCommittedTruckerOrgs,
  }
})
