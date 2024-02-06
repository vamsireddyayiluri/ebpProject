<script setup>
import { ref, watch, toRefs } from 'vue'
import { getColor } from '~/helpers/colors'

const props = defineProps({
  size: {
    type: Number,
    default: () => 350,
  },
  step: {
    type: Number,
    default: () => 5,
  },
  interval: {
    type: Number,
    default: () => 100,
  },
  loading: Boolean,
})

const { loading } = toRefs(props)

const count = ref(0)
const show = ref(true)

const startCounting = () => {
  const counting = setInterval(() => {
    if (count.value < 100) {
      count.value += props.step
    } else {
      clearInterval(counting)
    }
  }, props.interval)
}

const stopCounting = () => {
  count.value = 100
  setTimeout(() => (show.value = false, count.value = 0), 200)
}

watch(loading, newLoading => {
  if (newLoading) {
    // Reset values and start counting when loading is true
    count.value = 0
    show.value = true
    startCounting()
  } else {
    // Stop counting and hide when loading is false
    stopCounting()
  }
})
onMounted(() => {
  if (loading.value) {
    startCounting()
  } else stopCounting()
})
</script>

<template>
  <div
    v-if="show"
    class="fixed w-screen h-screen z-20 flex justify-center items-center"
    :style="{ background: getColor('uiPrimary') }"
  >
    <ProgressCircular
      :size="size"
      :value="count"
      text="Loading..."
      class=""
    >
      {{ count }}%
    </ProgressCircular>
  </div>
</template>
