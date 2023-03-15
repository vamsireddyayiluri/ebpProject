<script setup>
import { useAuthStore } from '~/stores/auth.store'

const authStore = useAuthStore()
const attrs = useAttrs()
const route = useRoute()
const items = ref([
  {
    name: 'dashboard',
    icon: 'mdi-home',
  },
  {
    name: 'marketplace',
    icon: 'mdi-cube-scan',
  },
  {
    name: 'settings',
    icon: 'mdi-cog',
  },
])

const data = [
  { title: 'Trucker ABCD registered on the platform', label: 'Info [Notification]', type: 'info' },
  {
    title: 'Trucker ABCD registered on the platform',
    content: '02/20/2022 5:23:17 am',
    type: 'info',
    button: true,
  },
  {
    title: 'Trucker ABCD registered on the platform',
    content: '02/20/2022 5:23:17 am',
    type: 'warning',
  },
  {
    title: 'Trucker ABCD registered on the platform',
    content: '02/20/2022 5:23:17 am[Notification]',
    type: 'avatar',
  },
  {
    title: 'Trucker ABCD registered on the platform',
    content: '02/20/2022 5:23:17 am',
    type: 'avatar',
  },
  {
    title: 'Trucker ABCD registered on the platform',
    content: '02/20/2022 5:23:17 am',
    type: 'avatar',
    button: true,
  },
]

const userMenuItems = ref([{ name: 'Profile settings', path: 'profile' }])
</script>

<template>
  <div v-bind="{ ...attrs }">
    <Header
      :items="items"
      :notifications="data"
      :route="route"
      :user-menu-items="userMenuItems"
      sticky
      @logout="authStore.logout()"
    />
    <slot />
  </div>
</template>

<style lang="scss"></style>
