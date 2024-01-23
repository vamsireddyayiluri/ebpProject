import { defineStore } from 'pinia'
import chatData from '~/fixtures/chat.json'
import { useAlertStore } from '~/stores/alert.store'
import { useDate } from '~/composables'
import moment from 'moment-timezone'
import { useNotificationStore } from '~/stores/notification.store'

export const useChatStore = defineStore('chat', () => {
  const alertStore = useAlertStore()
  const { addNewNotification } = useNotificationStore()
  const router = useRouter()
  const formatDate = useDate()
  const chats = ref(chatData)
  const activeChatId = ref('')
  const isNewMessage = computed(() => chats.value.some(i => i.unreadCount))
  const today = moment()
  const newMessage = {
    chatId: '123',
    message: {
      id: today.valueOf(),
      senderId: '001',
      content: 'I need your containers',
      date: today.format('MM/DD/YYYY'),
      timestamp: formatDate.todayYesterdayDate(today),
    },
  }
  const sendNewMessage = () => {
    const index = chats.value.findIndex(c => c.chatId === newMessage.chatId)
    if (index > -1) {
      const chat = chats.value[index]
      chats.value[index] = {
        ...chat,
        messages: [...chat.messages, newMessage.message],
        unreadCount: chat.unreadCount + 1,
        lastMessage: {
          content: newMessage.message.content,
          timestamp: newMessage.message.timestamp,
        },
      }
    } else {
      createNewChat()
    }
  }

  const createNewChat = () => {
    const toasty = {
      title: 'Chris Rock started a conversation with you',
      content: formatDate(new Date()),
      button: { name: 'Go to chat', callback: () => goToChat(newMessage.chatId) },
    }
    alertStore.info(toasty)
    addNewNotification.info(toasty)
    const newChat = {
      chatId: newMessage.chatId,
      user: {
        id: 'newUsersId',
        avatar:
          'https://creazilla-store.fra1.digitaloceanspaces.com/icons/7912990/avatar-icon-md.png',
        username: 'Chris Rock',
        status: 'online',
      },
      lastMessage: {
        content: newMessage.message.content,
        timestamp: newMessage.message.timestamp,
      },
      unreadCount: 1,
      messages: [newMessage.message],
    }
    chats.value.push(newChat)
  }

  const goToChat = chatId => {
    if (router.currentRoute.value.name === 'chat') {
      activeChatId.value = chatId
    } else {
      router.push('chat').then(() => (activeChatId.value = chatId))
    }
    const index = chats.value.findIndex(c => c.chatId === chatId)
    if (index > -1) {
      const chat = chats.value[index]
      chats.value[index] = {
        ...chat,
        unreadCount: 0,
      }
    }
  }

  return {
    chats,
    activeChatId,
    sendNewMessage,
    isNewMessage,
    goToChat,
  }
})
