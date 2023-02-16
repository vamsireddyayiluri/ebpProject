<script setup>
import { useTheme } from 'vuetify'
import logo from '@/assets/logo.svg?raw'

const form = ref({
  email: '',
  password: '',
  remember: false,
})
const vuetifyTheme = useTheme()

const isPasswordVisible = ref(false)
</script>

<template>
  <div class="d-flex align-center justify-center pa-4">Login</div>
</template>

<style lang="scss">
@use '@core/scss/pages/page-auth.scss';
</style>

<route lang="yaml">
meta:
  layout: blank
</route>
