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

onBeforeMount(() => {
  authStore.getUser()
})
</script>

<template>
  <ThemeProvider>
    <AppAlert />
    <RouterView v-if="!isLoading" />
    <ProgressCircular
      v-else
      :size="350"
      value="15"
      text="Loading..."
      class="absolute top-[calc(50vh-125px)] left-[calc(50%-125px)]"
    >
      15%
    </ProgressCircular>
  </ThemeProvider>
</template>

<style scoped></style>
