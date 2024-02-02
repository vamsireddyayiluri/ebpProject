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
const { openChat, sendNewMessage } = useChatStore()
const { chats, activeChatId } = storeToRefs(useChatStore())
const currentUserId = ref(userData.userId)

const messageActionHandler = ({ action, message }) => {
  console.log('action ', action, message)
}

const computedChat = computed(() => chats.value.find(c => c.chatId === activeChatId.value))
const sendMessage = async message => {
  await sendNewMessage(message)
}
</script>

<template>
  <Main>
    <ChatWindow
      :current-user-id="currentUserId"
      :messages="computedChat?.messages"
      :menu-action="messageActions"
      :chats="chats"
      :active-chat-id="activeChatId"
      @messageActionHandler="messageActionHandler"
      @openChat="openChat"
      @sendMessage="sendMessage"
    />
  </Main>
</template>
