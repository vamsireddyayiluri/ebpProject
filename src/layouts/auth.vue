<script setup>
import logo from '/src/assets/images/logo.png'
</script>

<template>
  <div class="auth-layout">
    <div>
      <img :src="logo" alt="qualle logo" class="logo" />
    </div>
    <div>
      <RouterView />
    </div>
  </div>
</template>

<style lang="scss">
@use '@layouts/styles/_auth.scss';
</style>
