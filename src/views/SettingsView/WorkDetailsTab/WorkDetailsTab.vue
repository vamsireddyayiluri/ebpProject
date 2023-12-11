<script setup>
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from 'pinia'

const workDetailsStore = useWorkDetailsStore()
const authStore = useAuthStore()
const { orgData } = storeToRefs(authStore)
const { yards } = storeToRefs(workDetailsStore)

const validateWorkDetail = computed(() => {
  if (yards.value.length !== orgData.value?.workDetails.length) return true
  for (let i = 0; i < yards.value.length; i++) {
    if (yards.value[i].id !== orgData.value.workDetails[i].id) {
      return true
    }
  }

  return false
})
const onSave = async () => {
  const filteredYards = yards.value.map(({ text, ...rest }) => {
    return rest
  })
  await workDetailsStore.saveYards(filteredYards)
}
const cancelChanges = () => {
  yards.value = [...orgData.value.workDetails]
}
onMounted(() => {
  workDetailsStore.getYards()
})
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Work details
  </Typography>
  <Yards class="w-full md:w-11/12 lg:w-8/12" />
  <SaveCancelChanges
    class="mt-10"
    :disabled="!validateWorkDetail"
    @onSave="onSave"
    @onCancel="cancelChanges"
  />
</template>

<style lang="scss" scoped></style>
