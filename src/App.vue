<script setup>
import { useTheme } from 'vuetify'

const vuetifyTheme = useTheme()
const storage = useStorage('theme')

onMounted(() => {
  vuetifyTheme.global.name.value = isDefined(storage.value) ? storage.value : 'light'
})
</script>

<template>
  <ThemeProvider>
    <AppAlert />
    <RouterView />
  </ThemeProvider>
</template>

<style scoped></style>
