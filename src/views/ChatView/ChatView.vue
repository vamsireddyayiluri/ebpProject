<script setup>
import { Main } from '@layouts'
import moment from 'moment-timezone'
import { useChatStore } from '~/stores/chat.store'
import { storeToRefs } from 'pinia'

const messageActions = [
  {
    name: 'replyMessage',
    title: 'Reply',
  },
  {
    name: 'editMessage',
    title: 'Edit Message',
    onlyMe: true,
  },
  {
    name: 'deleteMessage',
    title: 'Delete Message',
    onlyMe: true,
  },
]

const { chats: chatData, goToChat: openChat } = useChatStore()
const chats = ref(chatData)
const currentUserId = ref('000')
const dataStore = useChatStore()
const { activeChatId } = storeToRefs(dataStore)

const messageActionHandler = ({ action, message }) => {
  console.log('action ', action, message)
}

const computedChat = computed(() => chats.value.find(c => c.chatId === activeChatId.value))
const sendMessage = ({ content, chatId, files, replyMessage }) => {
  const newMessage = {
    id: chatId,
    senderId: currentUserId.value,
    content: content,
    timestamp: moment(new Date()).format('hh:mm A'),
    isEditedMessage: false,
    files,
    replyMessage,
  }
  computedChat?.value.messages.push(newMessage)
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
