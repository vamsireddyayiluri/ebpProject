<script setup>
import { getColor } from '~/helpers/colors'

const props = defineProps({
  data: Object,
})
const router = useRouter()
</script>

<template>
  <div
    :style="{ background: 'rgba(var(--v-theme-uiPrimary), 1)' }"
    class="!h-[calc(100vh-262px)] border rounded"
  >
    <div class="h-full max-w-[520px] mx-auto text-center py-12 px-3">
      <img
        :src="data.img"
        class="border rounded object-cover"
      />
      <Typography
        type="text-h1 mt-6 mb-3"
        :color="getColor('textPrimary')"
      >
        Welcome to Qualle!
      </Typography>
      <Typography :color="getColor('textSecondary')">
        Begin by booking and delivering trucks to unlock a world of comprehensive statistics and
        insights
      </Typography>
      <Button
        class="w-[126px] mt-10 mx-auto"
        @click="router.push({ name: 'dashboard' })"
      >
        Get Started</Button
      >
    </div>
  </div>
</template>
