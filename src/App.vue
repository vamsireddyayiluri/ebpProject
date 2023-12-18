<script setup>
import { useTheme } from 'vuetify'
import { useAuthStore } from './stores/auth.store'
import { useAlertStore } from '~/stores/alert.store'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { isLoading, userData } = storeToRefs(authStore)
const alertStore = useAlertStore()
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
</script>

<template>
  <ThemeProvider>
    <AppAlert />
    <Loader :loading="isLoading" />
    <RouterView v-if="!isLoading" />
  </ThemeProvider>
</template>

<style scoped></style>
