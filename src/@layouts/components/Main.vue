<script setup>
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '~/stores/notification.store'
import { useDisplay } from 'vuetify'
import { useChatStore } from '~/stores/chat.store'
import { useProfileStore } from "~/stores/profile.store"

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const chatStore = useChatStore()
const profileStore = useProfileStore()
const { accountInfo } = storeToRefs(profileStore)
const { isNewMessage } = storeToRefs(chatStore)
const attrs = useAttrs()
const { width } = useDisplay()
const route = useRoute()
const router = useRouter()

const getActiveRoute = name => {
  return route.name === name
}

const items = ref([
  {
    name: 'dashboard',
    icon: 'home',
    tooltip: 'Dashboard',
  },
  {
    name: 'calendar',
    icon: getActiveRoute('calendar') ? 'calendarFill' : 'calendar',
  },
  {
    name: 'statistics',
    icon: getActiveRoute('statistics') ? 'statFill' : 'stat',
  },
  {
    name: 'chat',
    icon: getActiveRoute('chat') ? 'chatFill' : 'chat',
    isUnread: isNewMessage,
  },
  {
    name: 'settings',
    icon: getActiveRoute('settings') ? 'settingFill' : 'setting',
  },
])

const mobileMenuItems = [
  { name: 'Dashboard', path: 'dashboard', icon: 'home' },
  { name: 'Calendar', path: 'calendar', icon: 'calendar' },
  { name: 'Statistics', path: 'statistics', icon: 'stat' },
  { name: 'Chat', path: 'chat', icon: 'chat', isUnread: isNewMessage },
  { name: 'Settings', path: 'settings', icon: 'setting' },
  { name: 'Profile settings', path: 'profile', icon: 'user' },
]
const { notifications } = storeToRefs(notificationStore)
const userMenuItems = ref([{ name: 'Profile settings', path: 'profile' }])
const readAllNotifications = async () => {
  await notificationStore.readAllNotifications()
}
const readNotification = async id => {
  const notification = notifications.value.find(i => i.id === id)
  if (notification.isUnread) {
    await notificationStore.readNotification(id)
  }
}
const onNotificationClick = async notification => {
  if (notification.button.route) {
    router.push(notification.button.route)
  }
}
onMounted(async () => {
  await notificationStore.getNotifications()
  await chatStore.getChats()
})
</script>

<template>
  <div v-bind="{ ...attrs }">
    <Header
      :user="{ avatar: accountInfo.imageUrl, userName: accountInfo.name }"
      class="default z-10 top-0"
      :items="width < 760 ? mobileMenuItems : items"
      :notifications="notifications"
      :route="route"
      :user-menu-items="userMenuItems"
      sticky
      @readAll="readAllNotifications"
      @readNotification="readNotification"
      @logout="authStore.logout()"
      @onNotificationClick="onNotificationClick"
    />
    <slot />
  </div>
</template>
