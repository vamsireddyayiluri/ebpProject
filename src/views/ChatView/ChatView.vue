<script setup>
import { Main } from '@layouts'
import { useChatStore } from '~/stores/chat.store'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth.store'
import { useAlertStore } from '~/stores/alert.store'

const messageActions = [
  {
    name: 'replyMessage',
    title: 'Reply',
  },
]

const { userData } = useAuthStore()
const alertStore = useAlertStore()
const { openChat, sendNewMessage, markAsRead, markUserAsOnlineOffline } = useChatStore()
const { chats, activeChat } = storeToRefs(useChatStore())
const currentUserId = ref(userData.userId)
const router = useRouter()

const messageActionHandler = ({ action, message }) => {
  console.log('action ', action, message)
}

const computedChat = computed(() => chats.value.find(c => c.chatId === activeChat.value?.chatId))
const sendMessage = async message => {
  await sendNewMessage(message)
}
const onChatArea = async chat => {
  if (chat.unreadCount) {
    await markAsRead(chat.chatId)
  }
}
onMounted(async () => {
  const interval = setInterval(async () => {
    const chatId = router.currentRoute.value.query.id

    // if activeChat exist in store save id in URL
    if (!chatId && activeChat.value) {
      await router.push({ query: { id: activeChat.value.chatId } })
    }

    // if chat id exists in URL open chat
    if (chats.value.length && chatId) {
      clearInterval(interval)
      await openChat(chatId)
    }
  }, 200)
  await markUserAsOnlineOffline('online')
})
onBeforeUnmount(async () => {
  await markUserAsOnlineOffline('offline')
})
</script>

<template>
  <Main>
    <ChatWindow
      :current-user-id="currentUserId"
      :messages="computedChat?.messages"
      :menu-action="messageActions"
      :chats="chats"
      :active-chat-id="activeChat?.chatId"
      @messageActionHandler="messageActionHandler"
      @openChat="openChat"
      @sendMessage="sendMessage"
      @onChatArea="onChatArea"
    />
  </Main>
</template>
