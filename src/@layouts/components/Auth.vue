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
  <div class="py-12 px-8 mx-auto text-center">
    <div class="relative">
      <Button
        v-if="router.currentRoute.value.name === 'reset-password'"
        prepend-icon="mdi-arrow-left-thin"
        variant="plain"
        secondary="true"
        class="absolute -top-1.5 left-0 p-0"
        @click="router.go(-1)"
      >
        Go back
      </Button>
      <img
        :src="logo"
        alt="qualle logo"
        class="h-9 mx-auto"
      >
    </div>
    <div>
      <slot />
      <RouterView />
    </div>
  </div>
</template>
