<script setup>
import { useTheme } from 'vuetify'
import { useAuthStore } from './stores/auth.store'
import { useAlertStore } from '~/stores/alert.store'
import { storeToRefs } from 'pinia'
import { useChatStore } from '~/stores/chat.store'

const authStore = useAuthStore()
const { isLoading, userData } = storeToRefs(authStore)
const alertStore = useAlertStore()
const { markUserAsOnlineOffline } = useChatStore()
const vuetifyTheme = useTheme()
const storage = useStorage('theme', '')
const route = useRoute()

onMounted(async () => {
  if (storage.value === 'undefined') {
    vuetifyTheme.global.name.value = 'light'
    storage.value = 'light'
  } else {
    vuetifyTheme.global.name.value = storage.value
  }
  if (!userData.value) {
    await authStore.getUser()
  }
})

onBeforeMount(async () => {
  await authStore.getUser()
})
watch(isLoading, async () => {
  if (!isLoading.value && userData.value) {
    await markUserAsOnlineOffline('online')
  }
})
</script>

<template>
  <ThemeProvider class="scrollbar">
    <AppAlert />
    <Loader :loading="isLoading" :interval="250"/>
    <RouterView v-if="!isLoading" />
  </ThemeProvider>
</template>

<style lang="scss">
@import '~/@core/scss/mixins.scss';
</style>
