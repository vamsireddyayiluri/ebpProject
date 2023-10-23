<script setup>
const newsSwitch = ref(false)
const newsNotification = ref('both notifications')
const showNewsNotification = ref(false)
const bookingsSwitch = ref(false)
const bookingsNotification = ref('both notifications')
const showBookingsNotification = ref(false)

const showNews = e => {
  showNewsNotification.value = e
}

const showBookings = e => {
  showBookingsNotification.value = e
}

const onSave = () => {
  const data = {}
  if (newsSwitch.value) {
    data.news = newsNotification.value
  }
  if (bookingsSwitch.value) {
    data.bookings = bookingsNotification.value
  }
  console.log('onSave ', data)
}
</script>

<template>
  <div class="notificationTab w-full md:w-2/3 lg:w-1/2">
    <Typography type="text-h1 mb-8">
      Notifications
    </Typography>

    <div>
      <div class="w-fit flex items-center relative">
        <Switch
          v-model="newsSwitch"
          @update:modelValue="showNews"
        >
          <Typography class="flex items-center gap-2">
            News and updates
          </Typography>
        </Switch>
        <div
          v-if="newsSwitch"
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
          v-model="newsNotification"
          class="mt-9 ml-13"
        />
      </div>
    </div>
    <div class="my-6 mb-14">
      <div class="w-fit flex items-center relative">
        <Switch
          v-model="bookingsSwitch"
          @update:modelValue="showBookings"
        >
          <Typography class="flex items-center gap-2">
            Information about bookings
          </Typography>
        </Switch>
        <div
          v-if="bookingsSwitch"
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
          v-model="bookingsNotification"
          class="mt-9 ml-13"
        />
      </div>
    </div>
  </div>
  <SaveCancelChanges @onSave="onSave" />
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
