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
import { useBookingHistoryStore } from '~/stores/bookingHistory.store'
import { cloneDeep, isEqual } from 'lodash'
import container from '~/assets/images/container.png'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import containersSizes from '~/fixtures/containersSizes.json'
import { useAlertStore } from '~/stores/alert.store'
import {
  checkPositiveInteger,
  validateExpiryDate,
  validateFlexibleSizes,
} from '~/helpers/validations-functions'

const authStore = useAuthStore()
const alertStore = useAlertStore()

const { userData } = authStore
const { getBookings, getBooking, publishDraft, removeFromNetwork, deleteBooking, updateBooking } =
  useBookingsStore()
const {
  getBooking: getBookingInHistory,
  deleteHistoryBooking,
  reactivateBooking,
  duplicateBooking,
} = useBookingHistoryStore()
const workDetailsStore = useWorkDetailsStore()
const { yards } = storeToRefs(workDetailsStore)
const { bookings, drafts } = storeToRefs(useBookingsStore())
const route = useRoute()
const router = useRouter()
const { smAndDown } = useDisplay()
const drawer = ref(true)
const flyoutBottom = ref(false)
const booking = ref(null)
const removeBookingDialog = ref(null)
const activated = ref(null)
const hideChip = ref(null)
const loading = ref(null)
const currentDate = ref(new Date())
const form = ref(null)
const validExpiryDate = ref(false)

const rules = {
  containers: value => checkPositiveInteger(value),
}

const updateExpiryDate = value => {
  booking.value.bookingExpiry = value
}
const updatePreferredDate = value => {
  booking.value.preferredDate = value
}
const updateSize = () => {
  booking.value.size = null
}
const toggleFlyoutPosition = () => {
  drawer.value = false
  setTimeout(() => {
    flyoutBottom.value = !flyoutBottom.value
    drawer.value = true
  }, 350)
}
const queryParams = router.currentRoute.value.query
const fromDraft = queryParams.from === 'draft'
const fromHistory = queryParams.from === 'history'
const completed = computed(() => booking.value?.status === statuses.completed)
const expired = computed(() => booking.value?.status === statuses.expired)

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
  if (fromHistory) {
    await deleteHistoryBooking(booking.value.id)
  } else {
    await deleteBooking(booking.value.id, fromDraft)
  }
  router.push('/dashboard')
}
const handleAction = async e => {
  if (e) {
    animate()
    if (completed.value) {
      booking.value.ref = null
    }
  }
}
const animate = async () => {
  activated.value = true
  setTimeout(async () => {
    hideChip.value = true
  }, 2000)
}
const validateRequiredFields = () => {
  return (
    !(booking.value.ref &&
    booking.value.containers > 0 &&
    booking.value.commodity &&
    booking.value.weight > 0 &&
    booking.value.targetRate > 0 &&
    booking.value.bookingExpiry &&
    booking.value.preferredDate &&
    booking.value.scacList.list.length &&
    booking.value.size &&
    booking.value.size
      ? booking.value.size.length > 0
      : false && booking.value.targetRateType) ||
    validateFlexibleSizes(booking.value.size, booking.value.flexibleBooking)?.length > 0
  )
}

const isDisabledPublish = computed(() => {
  return (
    validateRequiredFields() ||
    (!validExpiryDate.value &&
      moment(booking.value.bookingExpiry).endOf('day').isBefore(currentDate.value)) ||
    moment(booking.value.preferredDate).endOf('day').isBefore(currentDate.value)
  )
})

const validateBooking = computed(() => {
  let condition = isEqual(
    booking.value,
    fromDraft
      ? drafts.value.find(i => i.id === booking.value.id)
      : bookings.value.find(i => i.id === booking.value.id),
  )
  condition = condition || validateRequiredFields()

  condition =
    condition ||
    moment(booking.value.bookingExpiry).isBefore(currentDate.value) ||
    moment(booking.value.preferredDate).isBefore(currentDate.value)

  if (!fromDraft) {
    condition = condition || !validExpiryDate.value
  }

  return condition
})
const cancelChanges = async () => {
  if (expired.value || completed.value) {
    activated.value = false
    hideChip.value = false
    booking.value = await getBookingInHistory(route.params.id)

    return
  }
  booking.value = cloneDeep(
    useArrayFind(fromDraft ? drafts.value : bookings.value, i => i.id === route.params.id).value,
  )
}
const onSave = async () => {
  if (activated) {
    if (expired.value) {
      await reactivateBooking(booking.value)
      await router.push({ name: 'dashboard' })
      activated.value = false

      return
    }
    if (completed.value) {
      await duplicateBooking(booking.value)
      await router.push({ name: 'dashboard' })
      activated.value = false

      return
    }
  }
  await updateBooking(booking.value, fromDraft ? 'drafts' : 'bookings')
  await router.push({ name: 'dashboard' })
}
const validateExpiryDates = () => {
  validExpiryDate.value = validateExpiryDate(bookings?.value, booking.value)
}

onMounted(async () => {
  loading.value = true
  if (fromHistory) {
    booking.value = await getBookingInHistory(route.params.id)
    if (queryParams.activated) {
      animate()
    }
  } else if (fromDraft) {
    booking.value = await getBooking({ id: route.params.id, draft: true })
  } else {
    booking.value = await getBooking({ id: route.params.id })
  }
  await getBookings(fromDraft ? { draft: true } : {})
  loading.value = false
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
        <div class="min-h-[48px] flex items-center gap-4 mb-1.5">
          <Typography type="text-h1">
            Booking <b>Ref #{{ booking.ref }}</b>
            <span :style="{ color: getColor('textSecondary') }">
              {{ fromDraft ? ' (Draft)' : '' }}
              {{ booking.status ? (completed ? '(Completed)' : '(Expired)') : '' }}
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
            v-if="!(expired || completed)"
            variant="outlined"
            data="secondary1"
            class="ml-auto px-12"
            :disabled="fromDraft ? isDisabledPublish : false"
            @click="handleBookingChanges"
          >
            {{ fromDraft ? 'publish' : 'Remove from network' }}
          </Button>
        </div>
        <Typography :color="getColor('textSecondary')">
          created by {{ userData.type }} {{ userData?.workerId ? '#' + userData.workerId : null }}
        </Typography>
        <div
          v-if="expired || completed"
          class="mt-6 -mb-2"
          :class="{ hidden: hideChip }"
        >
          <div
            v-if="activated"
            class="h-14 flex items-center gap-4"
            :class="{ 'animate-slideUp': activated }"
          >
            <div
              class="w-11 h-6 flex justify-center items-center rounded-full"
              :style="{ background: getColor('uiLineInteractiveActive') }"
            >
              <Icon
                icon="mdi-check"
                size="16"
                :color="getColor('uiPrimary')"
              />
            </div>
            <Typography>
              {{ completed ? 'You have duplicated booking' : 'You have re-activated booking' }}
            </Typography>
          </div>
          <Switch
            v-else
            :label="completed ? 'Duplicate booking' : 'Re-activate booking'"
            class="h-fit"
            @update:modelValue="handleAction"
          />
        </div>
        <VForm
          ref="form"
          class="w-full md:w-3/4 grid sm:grid-cols-2 grid-cols-1 gap-6 mt-10 [&>div]:h-fit"
          :class="{
            'md:w-full': drawer && !flyoutBottom,
          }"
          @submit.prevent
        >
          <Textfield
            v-model.trim="booking.ref"
            label="Booking ref*"
            required
            :disabled="expired || (completed && !activated)"
          />
          <Textfield
            v-model.number="booking.containers"
            label="Number of containers*"
            type="number"
            :rules="[rules.containers]"
            required
            :disabled="expired || completed"
          />
          <Autocomplete
            v-model="booking.line"
            :items="getAllLines()"
            label="SSL *"
            required
            item-title="label"
            item-value="id"
            return-object
            :disabled="expired || completed"
          />
          <Textfield
            v-model="booking.commodity"
            label="Commodity*"
            required
            :disabled="expired || completed"
          />
          <Datepicker
            :key="booking.bookingExpiry"
            :picked="booking.bookingExpiry ? moment(booking.bookingExpiry).toDate() : null"
            label="Loading date *"
            :disabled="!activated && (expired || completed)"
            :class="{ 'pointer-events-none': !activated && (expired || completed) }"
            :lower-limit="(booking.preferredDate && new Date(booking.preferredDate)) || currentDate"
            @onUpdate="updateExpiryDate"
            :error-messages="validateExpiryDates()"
          />
          <Datepicker
            :key="booking.preferredDate"
            :picked="booking.preferredDate ? moment(booking.preferredDate).toDate() : null"
            label="Preferred carrier window"
            :disabled="!activated && (expired || completed)"
            :class="{ 'pointer-events-none': !activated && (expired || completed) }"
            :upper-limit="booking.bookingExpiry && new Date(booking.bookingExpiry)"
            :lower-limit="currentDate"
            @onUpdate="updatePreferredDate"
          />
          <Autocomplete
            v-model="booking.location"
            :items="
              yards.map(yard => ({
                address: yard.value,
                geohash: yard.geohash,
                label: yard.label,
                lat: yard.lat,
                lng: yard.lng,
              }))
            "
            label="Yard label *"
            item-title="label"
            item-value="address"
            return-object
            required
            :disabled="expired || completed"
          />
          <Textfield
            v-model.number="booking.weight"
            label="Average Weight*"
            type="number"
            :rules="[rules.containers]"
            required
            :disabled="expired || completed"
          />

          <RadioGroup v-model="booking.targetRateType">
            <Radio
              value="All in rate"
              label="All in rate"
              :disabled="expired || completed"
            />
            <Radio
              value="Linehaul + FSC Only"
              label="Linehaul + FSC Only"
              :disabled="expired || completed"
            />
          </RadioGroup>
          <Textfield
            v-model.number="booking.targetRate"
            label="Target Rate*"
            :rules="[rules.containers]"
            type="number"
            required
            :disabled="expired || completed"
          />
          <Checkbox
            v-model="booking.flexibleBooking"
            label="Flexible Booking*"
            @change="updateSize"
            :disabled="expired || completed"
          />
          <Select
            v-model="booking.size"
            :items="containersSizes"
            label="Equipment type*"
            item-title="label"
            item-value="size"
            :multiple="booking.flexibleBooking"
            :disabled="expired || completed"
            :error-messages="validateFlexibleSizes(booking.size, booking.flexibleBooking)"
          />
          <AutocompleteScac
            :key="booking.scacList"
            :scac-list="booking.scacList"
            :disabled="expired || completed"
          />
        </VForm>
        <SaveCancelChanges
          v-if="!(expired || completed) || activated"
          :disabled="validateBooking"
          @onSave="onSave"
          @onCancel="cancelChanges"
        />
      </div>
      <div
        class="statisticsFlyout flex flex-col pt-8 transition-all duration-300"
        :class="[flyoutBottom || smAndDown ? 'bottom' : 'right', drawer ? 'active' : '']"
      >
        <div class="flex justify-between items-center">
          <Typography type="text-h1"> Statistics </Typography>
          <IconButton
            v-if="!smAndDown"
            :icon="!flyoutBottom ? 'mdi-dock-bottom' : 'mdi-dock-right'"
            :class="{ 'mr-auto ml-4': flyoutBottom }"
            @click="toggleFlyoutPosition"
          />
        </div>
        <div class="statisticsContent">
          <div class="statisticsProgress">
            <Typography type="text-h4"> Fulfillment progress </Typography>
            <ProgressCircular
              :size="260"
              :value="getBookingLoad(booking.committed, booking.containers)"
              text="fullfilled"
              class="flex my-1 mx-auto"
            >
              {{ getBookingLoad(booking.committed, booking.containers) }}%
            </ProgressCircular>
          </div>
          <div class="statisticsTimeline">
            <Typography type="text-h4"> Booking timeline </Typography>
            <div class="timeline scrollbar">
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
    <div v-else-if="loading" />
    <div
      v-else
      class="w-full h-[calc(100vh-120px)] flex flex-col gap-2 justify-center items-center"
    >
      <img
        :src="container"
        class="container-img"
        alt="qualle container"
      />
      <Typography
        type="text-h1"
        class="!text-7xl mb-4 text-center"
      >
        Booking does not exist!
      </Typography>
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
            margin-top: 40px;
          }
        }

        & > div {
          border: 1px solid rgba(var(--v-theme-uiLine), 1);
          border-radius: 4px;
          padding: 24px 32px;
        }
      }
      @media (max-width: 600px) {
        .statisticsContent {
          flex-wrap: wrap;
          .statisticsProgress {
            width: 100%;
          }
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

@keyframes slideUp {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-100%);
    opacity: 0;
  }
}

.animate-slideUp {
  animation: slideUp 1s ease-out 1s;
}
</style>
