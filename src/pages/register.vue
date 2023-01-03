<script setup>
import { useTheme } from 'vuetify'
import logo from '@/assets/logo.svg?raw'

const form = ref({
  username: '',
  email: '',
  password: '',
  privacyPolicies: false,
})
const vuetifyTheme = useTheme()

const isPasswordVisible = ref(false)
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4" />
</template>

<style lang="scss">
@use '@core/scss/pages/page-auth.scss';
</style>

<route lang="yaml">
meta:
  layout: blank
</route>
