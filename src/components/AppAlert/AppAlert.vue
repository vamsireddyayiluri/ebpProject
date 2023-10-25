<script setup>
import { storeToRefs } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'
const alertStore = useAlertStore()
const { alert } = storeToRefs(alertStore)
</script>

<template>
  <Snackbar
    v-model="alert.show"
    :timeout="alert.timeout"
  >
    <Alert
      :type="alert.type"
      @close="alertStore.close()"
    >
      <AlertTitle>{{ alert.title }}</AlertTitle>
      <AlertText>{{ alert.content }}</AlertText>
    </Alert>
  </Snackbar>
</template>
