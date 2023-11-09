<script setup>
import { Main } from '@layouts'
import { useAuthStore } from '~/stores/auth.store'
import { getColor } from '~/helpers/colors'
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import moment from 'moment-timezone'
import { useDisplay } from 'vuetify'
import { getBookingLoad } from '~/helpers/countings'
import { useBookingsStore } from '~/stores/bookings.store'
import { storeToRefs } from 'pinia'
import { statuses } from '~/constants/statuses'
import {useBookingHistoryStore} from "~/stores/bookingHistory.store"

const authStore = useAuthStore()
const { publishDraft, removeFromNetwork, deleteBooking } = useBookingsStore()
const { bookings, drafts } = storeToRefs(useBookingsStore())
const { bookings: historyBookings } = storeToRefs(useBookingHistoryStore())
const route = useRoute()
const router = useRouter()
const { smAndDown } = useDisplay()
const drawer = ref(true)
const flyoutBottom = ref(false)
const booking = ref(null)
const removeBookingDialog = ref(null)

const updateExpiryDate = value => {
  booking.value.bookingExpiry = value
}
const updatePreferredDate = value => {
  booking.value.bookingExpiry = value
}
const toggleFlyoutPosition = () => {
  drawer.value = false
  setTimeout(() => {
    flyoutBottom.value = !flyoutBottom.value
    drawer.value = true
  }, 350)
}
const fromDraft = router.options.history.state.from === 'draft'
const fromHistory = router.options.history.state.from === 'history'

const handleBookingChanges = async () => {
  if (fromDraft) {
    const res = await publishDraft(booking.value)
    if (res === 'published') {
      router.push('/dashboard')
    }
  } else {
    const res = await removeFromNetwork(booking.value)
    if (res === 'deleted') {
      router.push('/dashboard')
    }
  }
}

const openRemoveDialog = () => {
  removeBookingDialog.value.show(true)
  removeBookingDialog.value.data = booking.value
}
const deleteFromPlatform = async () => {
  deleteBooking(booking.value.id)
  router.push('/dashboard')
}
const cancelChanges = () => {}
const onSave = () => {
  console.log('save ', booking.value)
}

onMounted(() => {
  booking.value = useArrayFind(
    fromDraft ? drafts.value : fromHistory? historyBookings.value: bookings.value,
    i => i.id === route.params.id,
  ).value
})
</script>

<template>
  <Main>
    <SubHeader
      show-arrows
      sticky
      class="top-16 z-20"
    >
      <template #controls>
        <Button
          prepend-icon="mdi-arrow-left-thin"
          variant="plain"
          secondary="true"
          class="!h-[56px] p-0"
          @click="router.go(-1)"
        >
          Go back
        </Button>
      </template>
      <template #actions>
        <Button
          prepend-icon="mdi-chart-line"
          variant="plain"
          @click="drawer = !drawer"
        >
          Statistics
        </Button>
      </template>
    </SubHeader>
    <div
      v-if="booking"
      class="flex"
      :class="{ 'flex-col': flyoutBottom || smAndDown, 'overflow-hidden': !drawer }"
    >
      <div class="w-full p-8 relative">
        <div class="flex items-center gap-4 mb-1.5">
          <Typography type="text-h1">
            Booking <b>Ref#{{ booking.ref }}</b>
            <span :style="{color: getColor('textSecondary')}">
              {{ fromDraft ? ' (Draft)' : '' }}
              {{ booking.status? booking.status === statuses.completed ? '(Completed)' : '(Expired)' : '' }}
            </span>
          </Typography>
          <IconButton
            icon="mdi-link"
            size="22"
            variant="plain"
            :color="getColor('iconButton-1')"
          />
          <IconButton
            icon="mdi-delete"
            size="22"
            variant="plain"
            :color="getColor('iconButton-1')"
            @click="openRemoveDialog"
          />
          <Button
            v-if="!fromHistory"
            variant="outlined"
            data="secondary1"
            class="ml-auto px-12"
            @click="handleBookingChanges"
          >
            {{ fromDraft ? 'publish' : 'Remove from network' }}
          </Button>
        </div>
        <Typography :color="getColor('textSecondary')">
          created by Operator #23
        </Typography>
        <div
          class="w-full md:w-3/4 grid sm:grid-cols-2 grid-cols-1 gap-6 mt-10 [&>div]:h-fit"
          :class="{ 'md:w-full': drawer && !flyoutBottom }"
        >
          <Textfield
            v-model="booking.ref"
            label="Booking ref*"
            required
          />
          <Textfield
            v-model="booking.amount"
            label="Number of containers*"
            type="number"
            required
          />
          <Datepicker
            :picked="moment(booking.expiryDate).toDate()"
            label="Booking expiry *"
            required
            @onUpdate="updateExpiryDate"
          />
          <Datepicker
            :picked="moment(booking.preferredDate).toDate()"
            label="Preferred carrier window"
            @onUpdate="updatePreferredDate"
          />
          <Select
            v-model="booking.line.label"
            :items="getAllLines()"
            label="SSL"
            required
            item-title="label"
            item-value="type"
          />
          <Select
            v-model="booking.location.label"
            :items="['Good yard', 'Work yard', 'Farm yard']"
            label="Yard label *"
            required
          />
          <AutocompleteScac :scac-list="booking.scacList" />
          <Textfield
            v-model="booking.size"
            type="text"
            label="Equipment type*"
            hint="For e.g. 40 HC"
            persistent-hint
          />
        </div>
        <SaveCancelChanges
          v-if="!fromHistory"
          @onSave="onSave"
          @onCancel="cancelChanges"
        />
      </div>
      <div
        class="statisticsFlyout flex flex-col pt-8 transition-all duration-300"
        :class="[flyoutBottom || smAndDown ? 'bottom' : 'right', drawer ? 'active' : '']"
      >
        <div class="flex justify-between items-center">
          <Typography type="text-h1">
            Statistics
          </Typography>
          <IconButton
            v-if="!smAndDown"
            :icon="!flyoutBottom ? 'mdi-dock-bottom' : 'mdi-dock-right'"
            :class="{ 'mr-auto ml-4': flyoutBottom }"
            @click="toggleFlyoutPosition"
          />
        </div>
        <div class="statisticsContent">
          <div class="statisticsProgress">
            <Typography type="text-h4">
              Fulfillment progress
            </Typography>
            <ProgressCircular
              :size="260"
              :value="getBookingLoad(booking.booked, booking.amount)"
              text="fullfilled"
              class="flex my-1 mx-auto"
            >
              {{ getBookingLoad(booking.booked, booking.amount) }}%
            </ProgressCircular>
          </div>
          <div class="statisticsTimeline">
            <Typography type="text-h4">
              Booking timeline
            </Typography>
            <div class="timeline">
              <Timeline
                :items="[
                  {
                    title: 'RCAS commited 25 containers',
                    date: '02/20/2022 5:23:17 am',
                    type: 'icon',
                  },
                  {
                    title: 'Booking is 100% fullfilled',
                    date: '02/20/2022 5:23:17 am',
                  },
                  {
                    title: 'Expiring date approaching',
                    date: '02/20/2022 5:23:17 am',
                  },
                  {
                    title: 'OLAP cancelled 10 containers',
                    date: '02/20/2022 5:23:17 am',
                    type: 'icon',
                  },
                ]"
                :variant="flyoutBottom ? 'horizontal' : 'vertical'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Main>
  <Dialog
    ref="removeBookingDialog"
    max-width="480"
  >
    <template #text>
      <RemoveCancelDialog
        btn-name="Remove"
        @close="removeBookingDialog.show(false)"
        @onClickBtn="deleteFromPlatform(removeBookingDialog.data.id)"
      >
        <Typography>
          Are you sure you want to remove ref#
          <b>{{ removeBookingDialog.data.ref }}</b>
          from your bookings?
        </Typography>
      </RemoveCancelDialog>
    </template>
  </Dialog>
</template>

<style lang="scss">
.statisticsFlyout {
  width: 0;
  height: 0;
  &.active {
    padding: 32px;
    &.bottom {
      width: 100%;
      height: auto;
      .statisticsContent {
        display: flex;
        gap: 40px;
        margin-top: 26px;
        .statisticsTimeline {
          height: auto;
          width: 100%;
          overflow: auto;
          .timeline {
            overflow: auto;
            margin-top: 80px;
          }
        }
        & > div {
          border: 1px solid rgba(var(--v-theme-uiLine), 1);
          border-radius: 4px;
          padding: 24px 32px 0;
        }
      }
    }
    &.right {
      width: 450px;
      height: calc(100vh - 120px);
      &:before {
        content: '';
        width: 1px;
        height: 100%;
        background-color: rgba(var(--v-theme-uiLine), 1);
        position: fixed;
        top: 120px;
        margin-left: -32px;
      }
      .statisticsContent {
        .statisticsProgress {
          margin-top: 40px;
        }
        .statisticsTimeline {
          height: 100%;
          width: 100%;
          position: relative;
          .timeline {
            width: 100%;
            position: absolute;
            top: 48px;
            bottom: 0;
            left: 0;
            overflow-y: auto;
          }
        }
      }
    }
  }
}
</style>
