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
const { openChat, sendNewMessage, markAsRead, markUserAsOnlineOffline, downloadFileFromChat, getAllOrgs, goToChat } =
  useChatStore()
const { chats, activeChat, loading, activeChatMessages, companies, users } = storeToRefs(
  useChatStore(),
)
const currentUserId = ref(userData.userId)
const currentParticipantId = ref(userData.orgId)
const chatActions = [
  {
    name: 'viewMembers',
    title: 'View members',
  },
]
const router = useRouter()
const allParticipants = ref([])
const messageActionHandler = ({ action, ...rest }) => {
  console.log('action ', action, rest)
}

const chatActionHandler = ({ action, ...rest }) => {
  console.log('action ', action, rest)
}

const computedCompanies = computed(() => companies.value.map(val => toRaw(val)))
const computedUsers = computed(() => users.value.map(val => toRaw(val)))

const sendMessage = async message => {
  await sendNewMessage(message)
}
const onChatArea = async chat => {
  if (chat.unreadCount) {
    await markAsRead(chat.chatId)
  }
}
onMounted(async () => {
  allParticipants.value = await getAllOrgs()
  const interval = setInterval(async () => {
    const chatId = router.currentRoute.value.query.id

    // if activeChat exist in store save id in URL
    if (!chatId && activeChat.value) {
      await router.replace({ query: { id: activeChat.value.chatId } })
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

const createChat = async participantId => {
  await goToChat(participantId)
}
</script>

<template>
  <Main>
    <ChatWindow
      v-if="allParticipants.length"
      :current-participant-id="currentParticipantId"
      :current-user-id="currentUserId"
      :messages="activeChatMessages || []"
      :menu-action="messageActions"
      :chat-actions="chatActions"
      :chats="chats"
      :active-chat-id="activeChat?.chatId"
      :participants="computedCompanies"
      :users="computedUsers"
      :all-participants="allParticipants"
      @messageActionHandler="messageActionHandler"
      @chatActionHandler="chatActionHandler"
      @openChat="openChat"
      @sendMessage="sendMessage"
      @createChat="createChat"
    />
  </Main>
</template>
