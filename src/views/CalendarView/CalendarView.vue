<script setup>
import { Main } from '@layouts'
import { getColor } from '~/helpers/colors'
import bookingsData from '~/fixtures/bookings.json'
import moment from 'moment-timezone'
import { getBookingLoad, totalFulfilledBookings } from '~/helpers/countings'
import { useDate } from "~/composables"

const router = useRouter()
const { getFormattedDate } = useDate()
const options = ref({
  initialEvents: [],
})
const bookings = ref(bookingsData)
const removeBookingDialog = ref(null)
const createBookingDialog = ref(null)

const getEvents = bookings => {
  return bookings.map(i => {
    return {
      id: i.id,
      title: `Ref# ${i.ref}`,
      start: i.created,
      end: i.expiryDate,
      metadata: {
        name: `event-${Math.floor(Math.random() * 9) + 1}`,
        ref: i.ref,
        progress: getBookingLoad(i.committed, i.containers),
        carriers: i.carriers,
      },
    }
  })
}
const events = ref(getEvents(bookings.value))

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

const removeBooking = id => {
  const index = bookings.value.findIndex(i => i.id === id)
  bookings.value.splice(index, 1)
  removeBookingDialog.value.show(false)

  // remove in calendar
  removeBookingDialog.value.data.remove()
}
const today = moment()

const activeBookings = computed(() => {
  return bookings.value.filter(b => moment(b.expiryDate).isSameOrAfter(today, 'day'))
})
const nextExpiring = () => {
  const datesArray = activeBookings.value.sort((a, b) =>
    moment(a.expiryDate).diff(moment(b.expiryDate)),
  )

  return getFormattedDate(datesArray[0]?.expiryDate)
}
const openCreateBookingDialog = () => {
  createBookingDialog.value.show(true)
}
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
            <b>{{ nextExpiring() }}</b>
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
            <b>{{ totalFulfilledBookings(activeBookings) }}</b>
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
    <div class="h-[calc(100vh-196px)] mt-10 mx-8 mb-8">
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
        @onClickBtn="removeBooking(removeBookingDialog.data.extendedProps.metadata.ref)"
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
