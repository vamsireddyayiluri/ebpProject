<script setup>
import { useNotificationStore } from '~/stores/notification.store'
import { storeToRefs } from 'pinia'
import { cloneDeep, isEqual } from 'lodash'

const notificationStore = useNotificationStore()
const { settings, loading } = storeToRefs(useNotificationStore())
const newsSwitch = ref(settings.value.newsAndUpdates.active)
const bookingsSwitch = ref(settings.value.bookingsNotification.active)
const showNewsNotification = ref(false)
const showBookingsNotification = ref(false)
let comparativeObject = null
const isDisabled = ref(null)

const showNews = e => {
  showNewsNotification.value = e
  if (!showNewsNotification.value) {
    settings.value.newsAndUpdates.value = ''
  } else {
    settings.value.newsAndUpdates.value = comparativeObject.newsAndUpdates.value
  }
}
const showBookings = e => {
  showBookingsNotification.value = e
  if (!showBookingsNotification.value) {
    settings.value.bookingsNotification.value = ''
  } else {
    settings.value.bookingsNotification.value = comparativeObject.bookingsNotification.value
  }
}
const validate = () => {
  if (!settings.value || !comparativeObject) return false

  return !isEqual(settings.value, comparativeObject)
}
const onSave = async () => {
  await notificationStore.updateSettings(settings.value)
  comparativeObject = cloneDeep(settings.value)
  isDisabled.value = true
}
const cancelChanges = async () => {
  await notificationStore.getNotificationSettings()
}
onMounted(async () => {
  await notificationStore.getNotificationSettings()
  comparativeObject = cloneDeep(settings.value)
  newsSwitch.value = settings.value.newsAndUpdates.active
  bookingsSwitch.value = settings.value.bookingsNotification.active
})
onUpdated(() => {
  isDisabled.value = !validate()
})
</script>

<template>
  <div class="notificationTab w-full md:w-2/3 lg:w-1/2">
    <Typography type="text-h1 mb-8"> Notifications </Typography>

    <div v-if="!loading">
      <div class="w-fit flex items-center relative">
        <Switch
          v-model="settings.newsAndUpdates.active"
          @update:modelValue="showNews"
        >
          <Typography class="flex items-center gap-2"> News and updates </Typography>
        </Switch>
        <div
          v-if="settings.newsAndUpdates.active"
          :class="{ 'rotate-180': showNewsNotification }"
          class="w-fit transition duration-300 absolute top-3.5 -right-9"
        >
          <IconButton
            icon="mdi-chevron-down"
            size="20"
            width="24"
            min-width="24"
            height="24"
            variant="plain"
            @click="showNewsNotification = !showNewsNotification"
          />
        </div>
      </div>

      <div
        :class="{ 'transition-all  duration-1000 ease-in-out': !showNewsNotification }"
        class="overflow-hidden transition-all ease-in duration-500"
        :style="{ maxHeight: !showNewsNotification ? 0 : '1000px' }"
      >
        <NotificationRadioButton
          v-if="settings.newsAndUpdates.active"
          v-model="settings.newsAndUpdates.value"
          class="mt-9 ml-13"
        />
      </div>
    </div>
    <div
      v-if="!loading"
      class="my-6 mb-14"
    >
      <div class="w-fit flex items-center relative">
        <Switch
          v-model="settings.bookingsNotification.active"
          @update:modelValue="showBookings"
        >
          <Typography class="flex items-center gap-2"> Information about bookings </Typography>
        </Switch>
        <div
          v-if="settings.bookingsNotification.active"
          :class="{ 'rotate-180': showBookingsNotification }"
          class="w-fit transition duration-300 absolute top-3.5 -right-9"
        >
          <IconButton
            icon="mdi-chevron-down"
            size="20"
            width="24"
            min-width="24"
            height="24"
            variant="plain"
            @click="showBookingsNotification = !showBookingsNotification"
          />
        </div>
      </div>
      <div
        :class="{ 'transition-all duration-1000 ease-in-out': !showBookingsNotification }"
        class="overflow-hidden transition-all ease-in duration-500"
        :style="{ maxHeight: !showBookingsNotification ? 0 : '1000px' }"
      >
        <NotificationRadioButton
          v-if="settings.bookingsNotification.active"
          v-model="settings.bookingsNotification.value"
          class="mt-9 ml-13"
        />
      </div>
    </div>
  </div>
  <SaveCancelChanges
    :disabled="isDisabled"
    @onSave="onSave"
    @onCancel="cancelChanges"
  />
</template>

<style lang="scss">
.notificationTab {
  .styleRadio {
    height: auto;

    .v-label {
      white-space: pre-line;
    }
  }
}
</style>
