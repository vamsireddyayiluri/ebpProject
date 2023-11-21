<script setup>
import { useWorkDetailsStore } from "~/stores/workDetails.store"
import { useAuthStore } from "~/stores/auth.store"
import { storeToRefs } from "pinia"

const workDetailsStore = useWorkDetailsStore()
const authStore = useAuthStore()
const { orgData } = storeToRefs(authStore)
const yards = ref([])

const validateWorkDetail = computed(() => {
  if (yards.value.length !== orgData.value.workDetails.length) return true
  for (let i = 0; i < yards.value.length; i++) {
    if (yards.value[i].id !== orgData.value.workDetails[i].id) {
      return true
    }
  }

  return false
})
const onSave = async () => {
  await workDetailsStore.saveYards(yards.value)
}
const cancelChanges = () => {
  yards.value = [...orgData.value.workDetails]
}
onMounted(() => {
  yards.value = [...orgData.value.workDetails]
})
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Work details
  </Typography>
  <Yards class="w-full md:w-11/12 lg:w-8/12" :yards="yards"/>
  <SaveCancelChanges
    class="mt-10"
    :disabled="!validateWorkDetail"
    @onSave="onSave"
    @onCancel="cancelChanges"
  />
</template>

<style lang="scss" scoped>

</style>
