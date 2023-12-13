<script setup>
import { Main } from '@layouts'
import { getColor } from '~/helpers/colors'
import moment from 'moment-timezone'
import { getBookingLoad, totalFulfilledBookings } from '~/helpers/countings'
import { useDate } from '~/composables'
import { storeToRefs } from 'pinia'
import { useBookingsStore } from '~/stores/bookings.store'

const router = useRouter()
const { getFormattedDate } = useDate()
const bookingsStore = useBookingsStore()
const { loading, bookings } = storeToRefs(bookingsStore)
const options = ref({
  initialEvents: [],
})
const removeBookingDialog = ref(null)
const createBookingDialog = ref(null)

const getEvents = bookings => {
  return bookings.map(i => {
    return {
      id: i.id,
      title: `Ref# ${i.ref}`,
      start: i.createdAt,
      end: i.bookingExpiry,
      metadata: {
        name: `event-${Math.floor(Math.random() * 9) + 1}`,
        ref: i.ref,
        progress: getBookingLoad(i.committed, i.containers),
        carriers: i.carriers,
      },
    }
  })
}
const events = computed(() => getEvents(bookingsStore.bookings))

const onEventClick = e => console.log(e.event)
const onEvents = e => console.log(e)
const onEdit = e => {
  router.push({ path: `booking/${e.id}` })
}
const onEventAdd = e => console.log(e)
const onEventChange = e => console.log('change', e)
const onRemove = e => {
  removeBookingDialog.value.show(true)
  removeBookingDialog.value.data = e
}

const removeBooking = async id => {
  await bookingsStore.deleteBooking(id)
  removeBookingDialog.value.show(false)

  // remove in calendar
  removeBookingDialog.value.data.remove()
}
const today = moment()

const nextExpiring = computed(() => {
  const datesArray = bookings.value
    .filter(b => b)
    .sort((a, b) => moment(a.bookingExpiry).diff(moment(b.bookingExpiry)))

  return getFormattedDate(datesArray[0]?.bookingExpiry)
})
const openCreateBookingDialog = () => {
  createBookingDialog.value.show(true)
}
onMounted(async () => {
  await bookingsStore.getBookings({})
})
</script>

<template>
  <Main>
    <SubHeader
      show-arrows
      sticky
      class="!h-auto top-16 z-20"
    >
      <template #controls>
        <div class="flex items-center py-1 sm:!py-5">
          <Typography class="flex justify-center flex-wrap gap-2">
            <b>{{ nextExpiring }}</b>
            <div
              class="text-center"
              :style="{ color: getColor('textSecondary') }"
            >
              next expiring booking
            </div>
          </Typography>
          <Divider
            vertical=""
            class="mx-4"
          />
          <Typography class="flex justify-center flex-wrap gap-2">
            <b>{{ bookings.length }}</b>
            <div
              class="text-center"
              :style="{ color: getColor('textSecondary') }"
            >
              total bookings
            </div>
          </Typography>
          <Divider
            vertical=""
            class="mx-4"
          />
          <Typography class="flex justify-center flex-wrap gap-2">
            <b>{{ totalFulfilledBookings(bookings) }}</b>
            <div
              class="text-center"
              :style="{ color: getColor('textSecondary') }"
            >
              % of total bookings fulfilled
            </div>
          </Typography>
        </div>
      </template>
    </SubHeader>
    <div
      v-if="!loading"
      class="h-[calc(100vh-196px)] mt-10 mx-8 mb-8"
    >
      <Calendar
        :events="events"
        :options="options"
        @onEvents="onEvents"
        @onEventClick="onEventClick"
        @onEventAdd="onEventAdd"
        @onEventChange="onEventChange"
        @createBooking="openCreateBookingDialog"
      >
        <template #eventContent="{ event }">
          <Event
            :event="event"
            @onEdit="onEdit"
            @onRemove="onRemove"
          />
        </template>
      </Calendar>
    </div>
  </Main>
  <Dialog
    ref="createBookingDialog"
    class="max-w-[620px] md:max-w-[680px]"
  >
    <template #text>
      <CreateBookingDialog @close="createBookingDialog.show(false)" />
    </template>
  </Dialog>
  <Dialog
    ref="removeBookingDialog"
    max-width="480"
  >
    <template #text>
      <RemoveCancelDialog
        btn-name="Remove"
        @close="removeBookingDialog.show(false)"
        @onClickBtn="removeBooking(removeBookingDialog.data.id)"
      >
        <Typography>
          Are you sure you want to remove booking
          <b>ref# {{ removeBookingDialog.data.extendedProps.metadata.ref }}</b>
          from network?
        </Typography>
      </RemoveCancelDialog>
    </template>
  </Dialog>
</template>
