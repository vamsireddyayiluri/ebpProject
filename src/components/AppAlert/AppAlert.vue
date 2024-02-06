<script setup>
import { storeToRefs } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'

const alertStore = useAlertStore()
const { show, alertList } = storeToRefs(useAlertStore())
const handleLinkClick = async callback => {
  await callback()
}
</script>

<template>
  <Snackbar
    v-model="show"
    :timeout="-1"
  >
    <template
      v-for="a in alertList"
      :key="a.id"
    >
      <Alert
        :type="a.type"
        class="mb-2"
      >
        <AlertTitle>{{ a.title }}</AlertTitle>
        <AlertText v-html="a.content" />
        <Button
          v-if="a.button"
          variant="plain"
          height="20"
          class="mt-2 -ml-4"
          @click="handleLinkClick(a.button.callback), a.close(a.id, 0)"
        >
          {{ a.button.name }}
        </Button>
        <VRow
          v-if="a.addDeclineButtons"
          no-gutters
          align="center"
          class="mt-2"
        >
          <Button
            variant="plain"
            height="20"
            class="-ml-4"
            @click="a.close(a.id, 0)"
          >
            add
          </Button>
          <Divider
            vertical
            height="20"
          />
          <Button
            variant="plain"
            data="secondary1"
            height="20"
            @click="a.close(a.id, 0)"
          >
            decline
          </Button>
        </VRow>
      </Alert>
    </template>
  </Snackbar>
</template>
