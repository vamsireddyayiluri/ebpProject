<script setup>
import { getColor } from '~/helpers/colors'

const props = defineProps({
  data: Object,
})
const router = useRouter()
</script>

<template>
  <div
    class="!h-[calc(100vh-262px)] flex flex-col justify-center border rounded "
    :style="{ background: 'rgba(var(--v-theme-uiPrimary), 1)' }"
  >
    <div class="max-w-[520px] w-full mx-auto text-center py-12 px-3">
      <img
        :src="data.img"
        class="mx-auto max-h-[30vh] xl:max-h-[50vh] w-auto border rounded object-cover"
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
        Get Started
      </Button>
    </div>
  </div>
</template>
