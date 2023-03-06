<script setup>
import { useTheme } from 'vuetify'
import { useDataStore } from '~/stores/data.store'

const dataStore = useDataStore()

const vuetifyTheme = useTheme()
const storage = useStorage('theme')

onMounted(async () => {
  vuetifyTheme.global.name.value = isDefined(storage.value) ? storage.value : 'light'

  await dataStore.parseData()
})
</script>

<template>
  <ThemeProvider>
    <MyAlert />
    <RouterView />
  </ThemeProvider>
</template>

<style scoped></style>
