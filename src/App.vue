<script setup>
import { useTheme } from 'vuetify'
import { useAuthStore } from './stores/auth.store'

const authStore = useAuthStore()

const vuetifyTheme = useTheme()
const storage = useStorage('theme', '')

onMounted(() => {
  if (storage.value === 'undefined') {
    vuetifyTheme.global.name.value = 'light'
    storage.value = 'light'
  } else {
    vuetifyTheme.global.name.value = storage.value
  }
})

onBeforeMount(() => {
  authStore.getUser()
})
</script>

<template>
  <ThemeProvider>
    <AppAlert />
    <RouterView />
  </ThemeProvider>
</template>

<style scoped></style>
