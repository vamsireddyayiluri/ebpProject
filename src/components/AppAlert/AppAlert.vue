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
    <template v-for="(a, index) in alertList" :key="a.content + index">
      <Alert
        :type="a.type"
        class="mb-2"
      >
        <AlertTitle>{{ a.title }}</AlertTitle>
        <AlertText>{{ a.content }}</AlertText>
      </Alert>
    </template>
  </Snackbar>
</template>
