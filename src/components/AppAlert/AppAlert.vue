<script setup>
import { storeToRefs } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'

const alertStore = useAlertStore()
const { show, alertList } = storeToRefs(alertStore)
</script>

<template>
  <Snackbar
    v-model="show"
    :timeout="-1"
  >
    <template v-for="a in alertList" :key="a.id">
      <Alert
        :type="a.type"
        class="mb-2"
        @close="a.close(a.id, 0)"
      >
        <AlertTitle>{{ a.title }}</AlertTitle>
        <AlertText>{{ a.content }}</AlertText>
      </Alert>
    </template>
  </Snackbar>
</template>
