<script setup>
import { Main } from '@layouts'
import { getColor } from '~/helpers/colors'
import moment from 'moment-timezone'
import { getBookingLoad, getContainers, getNextLoading } from '~/helpers/countings'
import { storeToRefs } from 'pinia'
import { useBookingsStore } from '~/stores/bookings.store'
import { useCommitmentsStore } from '~/stores/commitments.store'

import { checkVendorDetailsCompletion } from '~/helpers/validations-functions'
import { groupBookings } from '~/stores/helpers'
import { statuses } from '~/constants/statuses'

const router = useRouter()
const bookingsStore = useBookingsStore()
const commitmentStore = useCommitmentsStore()

const { loading, notGroupedBookings } = storeToRefs(bookingsStore)
const options = ref({
  initialEvents: [],
})
const bookingConfirmationDialog = ref(null)
const removeBookingDialog = ref(null)
const createBookingDialog = ref(null)
const confirmClickedOutside = ref(null)

const getEvents = bookings => {
  return bookings.map(i => {
    return {
      id: i.id,
      title: `Ref# ${i.ref}`,
      start: moment(i.loadingDate).startOf('day').format(),
      end: i.loadingDate,
      metadata: {
        name: `event-${Math.floor(Math.random() * 9) + 1}`,
        ref: i.ref,
        progress: getBookingLoad(i.committed, i.containers),
        carriers: i?.carriers?.map(item => {
          return { scac: item.scac, fulfilled: item?.approved, total: i.containers }
        }),
      },
    }
  })
}
const events = computed(() => getEvents(bookingsStore.notGroupedBookings))

const onEventClick = e => console.log(e.event)
const onEvents = e => console.log(e)
const onEdit = async e => {
  const booking = bookingsStore.notGroupedBookings.find(obj => obj.id === e.id)

  const commitmentsList = await commitmentStore.getExpiredCommitments(booking.location.geohash)
  if (commitmentsList?.length) {
    bookingConfirmationDialog.value.show(true)
    bookingConfirmationDialog.value.data = commitmentsList
  } else {
    router.push({ path: `booking/${e.id}` })
  }
}
const onEventAdd = e => console.log(e)
const onEventChange = e => console.log('change', e)
const onRemove = async e => {
  const booking = bookingsStore.notGroupedBookings.find(obj => obj.id === e.id)

  const commitmentsList = await commitmentStore.getExpiredCommitments(booking.location.geohash)
  if (commitmentsList?.length) {
    bookingConfirmationDialog.value.show(true)
    bookingConfirmationDialog.value.data = commitmentsList
  } else {
    removeBookingDialog.value.show(true)
    removeBookingDialog.value.data = e
  }
}

const removeBooking = async id => {
  const booking = await bookingsStore.getBooking({ id: id, draft: false })
  await bookingsStore.removeFromNetwork(groupBookings([booking])[0])
  removeBookingDialog.value.show(false)

  // remove in calendar
  // removeBookingDialog.value.data.remove()
}

const closeConfirmBookingDialog = (isPending = false) => {
  if (!isPending) {
    bookingConfirmationDialog.value.show(false)
    bookingConfirmationDialog.value.data = null
  }
}
const onClickOutsideDialog = () => {
  confirmClickedOutside.value = true
  closeConfirmBookingDialog()
  setInterval(() => {
    confirmClickedOutside.value = false
  }, 1000)
}
const today = moment()

const nextLoading = computed(() => getNextLoading(notGroupedBookings.value))
const containers = computed(() => getContainers(notGroupedBookings.value))
const openCreateBookingDialog = () => {
  if (checkVendorDetailsCompletion()) {
    createBookingDialog.value.show(true)
  }
}
onMounted(async () => {
  await bookingsStore.getBookings({})
  useIntervalFn(async () => {
    await bookingsStore.getBookings({})
  }, 600000)
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
            <template v-if="nextLoading.date">
              <b>{{ nextLoading.date }}</b>
              <div
                class="text-center"
                :style="{ color: getColor('textSecondary') }"
              >
                Next loading date
              </div>
            </template>
            <template v-else> No upcoming loading</template>
          </Typography>
          <Divider
            vertical=""
            class="mx-4"
          />
          <Typography class="flex justify-center flex-wrap gap-2">
            <div
              class="text-center"
              :style="{ color: getColor('textSecondary') }"
            >
              Total active and pending bookings:
            </div>
            <b>{{
                notGroupedBookings.filter(b => b.status === statuses.active || b.status === statuses.pending)
                .length
            }}</b>
          </Typography>
          <Divider
            vertical=""
            class="mx-4"
          />
          <Typography class="flex justify-center flex-wrap gap-2">
            <b>{{ containers.committed }}</b>
            <div
              class="text-center"
              :style="{ color: getColor('textSecondary') }"
            >
              containers committed out of
              <b>{{ containers.containers }}</b>
              containers
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
    class="max-w-full max-w-[90vw]"
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
      <ConfirmationDialog
        btn-name="Remove"
        @close="removeBookingDialog.show(false)"
        @onClickBtn="removeBooking(removeBookingDialog.data.id)"
      >
        <Typography>
          Are you sure you want to remove booking
          <b>ref# {{ removeBookingDialog.data.extendedProps.metadata.ref }}</b>
          from network?
        </Typography>
      </ConfirmationDialog>
    </template>
  </Dialog>
  <Dialog
    ref="bookingConfirmationDialog"
    class="max-w-full sm:max-w-[90vw] md:max-w-[75vw]"
    @update:modelValue="onClickOutsideDialog"
  >
    <template #text>
      <BookingConfirmationDialog
        :commitments="bookingConfirmationDialog.data"
        :clicked-outside="confirmClickedOutside"
        @close="closeConfirmBookingDialog"
        @checkPending="e => closeConfirmBookingDialog(e)"
      />
    </template>
  </Dialog>
</template>
