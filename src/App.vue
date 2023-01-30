<script setup>
import { Header, ThemeProvider } from '@qualle-admin/qui'

const items = ref([
  {
    name: 'dashboard',
    icon: 'mdi-home',
  },
])
</script>

<template>
  <ThemeProvider>
    <Header :items="items" />
    <RouterView />
  </ThemeProvider>
</template>

<style scoped></style>
