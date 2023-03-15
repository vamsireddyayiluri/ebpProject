<script setup>
import { useTheme } from 'vuetify'
import { useAuthStore } from './stores/auth.store'

const authStore = useAuthStore()

const vuetifyTheme = useTheme()
const storage = useStorage('theme')

onMounted(() => {
  vuetifyTheme.global.name.value = isDefined(storage.value) ? storage.value : 'light'
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
