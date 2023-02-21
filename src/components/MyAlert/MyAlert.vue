<script setup>
import { storeToRefs } from 'pinia'
import { useAlertStore } from '@/stores/alert.store'
const alertStore = useAlertStore()
const { alert } = storeToRefs(alertStore)
</script>

<template>
  <div v-if="alert" class="alertWrapper">
    <Alert :type="alert.type" @close="alertStore.clear()">
      <AlertTitle>{{ alert.title }}</AlertTitle>
      <AlertText>{{ alert.message }}</AlertText>
    </Alert>
  </div>
</template>

<style lang="scss" scoped>
.alertWrapper {
  position: absolute;
  z-index: 20;
  right: 0;
}
</style>
