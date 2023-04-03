<script setup>
import logo from '~/assets/images/logo.png'
import { useTheme } from 'vuetify'

const router = useRouter()
const vuetifyTheme = useTheme()
const storage = useStorage('theme')

onMounted(() => {
  vuetifyTheme.global.name.value = 'light'
})
tryOnUnmounted(() => {
  vuetifyTheme.global.name.value = storage.value
})
</script>

<template>
  <div class="authLayout">
    <div class="position-relative">
      <Button
        v-if="router.currentRoute.value.name === 'reset-password'"
        prepend-icon="mdi-arrow-left-thin"
        variant="plain"
        secondary="true"
        class="backButton"
        @click="router.go(-1)"
      >
        Go back
      </Button>
      <img
        :src="logo"
        alt="qualle logo"
        class="logo"
      >
    </div>
    <div>
      <slot />
      <RouterView />
    </div>
  </div>
</template>

<style lang="scss">
.authLayout {
  padding: 48px 32px;
  margin: 0 auto;
  text-align: center;
  .logo {
    height: 36px;
  }
  .backButton {
    position: absolute;
    top: -5px;
    left: 0;
    padding: 0;
  }
}
</style>
