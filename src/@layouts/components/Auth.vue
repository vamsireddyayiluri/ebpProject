<script setup>
import logo from '/src/assets/images/logo.png'
</script>

<template>
  <div class="auth-layout">
    <div>
      <img :src="logo" alt="qualle logo" class="logo" />
    </div>
    <div>
      <slot />
      <RouterView />
    </div>
  </div>
</template>

<style lang="scss">
.auth-layout {
  padding: 48px 32px;
  margin: 0 auto;
  text-align: center;
  .logo {
    height: 36px;
  }
}
</style>
