<script setup>
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '~/stores/notification.store'
import { useDisplay } from 'vuetify'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const attrs = useAttrs()
const { width } = useDisplay()
const route = useRoute()
const router = useRouter()

const getActiveRoute = name => {
  return route.name === name
}
const { currentUser } = storeToRefs(authStore)

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
    name: 'settings',
    icon: getActiveRoute('settings') ? 'settingFill' : 'setting',
  },
])

const mobileMenuItems = [
  { name: 'Dashboard', path: 'dashboard', icon: 'home' },
  { name: 'Calendar', path: 'calendar', icon: 'calendar' },
  { name: 'Statistics', path: 'statistics', icon: 'stat'},
  { name: 'Settings', path: 'settings', icon: 'setting'},
  { name: 'Profile settings', path: 'profile', icon: 'user' },
]
const { notifications } = storeToRefs(notificationStore)
const userMenuItems = ref([{ name: 'Profile settings', path: 'profile' }])
</script>

<template>
  <div v-bind="{ ...attrs }">
    <Header
      class="default z-10 top-0"
      :items="width < 760 ? mobileMenuItems : items"
      :notifications="notifications"
      :route="route"
      :user-menu-items="userMenuItems"
      sticky
      @logout="authStore.logout()"
    >
      <template
        v-if="!currentUser"
        #controls
      >
        <Button
          variant="plain"
          density="compact"
          class="hidden sm:!block"
          @click="router.push({ name: 'register' })"
        >
          Register
        </Button>
        <Button
          variant="outlined"
          density="compact"
          @click="router.push({ name: 'login' })"
        >
          Log in
        </Button>
      </template>
    </Header>
    <slot />
  </div>
</template>
