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
import { cloneDeep, isEqual, pickBy } from 'lodash'
import container from '~/assets/images/container.png'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import containersSizes from '~/fixtures/containersSizes.json'
import { useAlertStore } from '~/stores/alert.store'
import {
  checkPositiveInteger,
  validateExpiryDate,
  validateFlexibleSizes,
  checkCommittedValue,
  validateAverageWeight,
} from '~/helpers/validations-functions'
import { insuranceTypes } from '~/constants/settings'
import { deepCopy } from 'json-2-csv/lib/utils'

const authStore = useAuthStore()
const alertStore = useAlertStore()

const { userData } = authStore
const {
  getBookings,
  getBooking,
  publishDraft,
  removeFromNetwork,
  deleteBooking,
  updateBooking,
  reactivateBooking,
  duplicateBooking,
} = useBookingsStore()

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
const insuranceItems = ref(insuranceTypes)
const isSaveLoading = ref(false)
const rules = {
  checkcommitted: value => checkCommittedValue(value, booking.value),
  averageWeight: value => validateAverageWeight(value, booking.value.location),
  containers: value => checkPositiveInteger(value),
  required(value) {
    return value?.toString().trim() ? true : 'Required field'
  },
}

const updateExpiryDate = (value, index) => {
  booking.value.details[index].date = moment(value).endOf('day').format()
}
const updatePreferredDate = value => {
  booking.value.preferredDate = moment(value).endOf('day').format()
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
const fromEdit = !fromDraft && !fromHistory
const completed = computed(() => booking.value?.status === statuses.completed)
const expired = computed(() => booking.value?.status === statuses.expired)
const pending = computed(() => booking.value?.status === statuses.pending)

const handleBookingChanges = async () => {
  if (fromDraft) {
    booking.value.loadingDate = moment(booking.value.loadingDate).endOf('day').format()
    booking.value.preferredDate = moment(booking.value.preferredDate).endOf('day').format()
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
  await deleteBooking(booking.value.id, fromDraft, fromHistory)
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
    booking.value.containers &&
    rules.checkcommitted(booking.value.containers) === true &&
    booking.value.commodity &&
    booking.value.insurance &&
    booking.value.weight &&
    rules.containers(booking.value.weight) === true &&
    booking.value.estimatedRate &&
    rules.containers(booking.value.estimatedRate) === true &&
    booking.value.loadingDate &&
    booking.value.preferredDate &&
    booking.value.scacList.list?.length &&
    booking.value.size &&
    booking.value.size
      ? booking.value.size.length > 0
      : false && booking.value.estimatedRateType) ||
    validateFlexibleSizes(booking.value.size, booking.value.flexibleBooking)?.length > 0
  )
}

const isDisabledPublish = computed(() => {
  return (
    validateRequiredFields() ||
    !validExpiryDate.value ||
    moment(booking.value.loadingDate).endOf('day').isBefore(currentDate.value) ||
    moment(booking.value.preferredDate).endOf('day').isBefore(currentDate.value)
  )
})

const validateBooking = computed(() => {
  if (fromEdit) {
    const selectedBooking = bookings.value.find(i => i.id === booking.value.id)
    booking.value.entities = selectedBooking?.entities
  }
  let condition = isEqual(
    booking.value,
    fromDraft
      ? drafts.value.find(i => i.id === booking.value.id)
      : bookings.value.find(i => i.id === booking.value.id),
  )
  condition = condition || validateRequiredFields()
  condition =
    condition ||
    moment(booking.value.loadingDate).endOf('day').isBefore(currentDate.value) ||
    moment(booking.value.preferredDate).endOf('day').isBefore(currentDate.value)

  if (!fromDraft) {
    condition = condition || !validExpiryDate.value
  }
  if (!fromDraft && !fromHistory && !condition) {
    condition = condition || booking.value.containers < booking.value.committed
  }

  return condition
})
const cancelChanges = async () => {
  if (expired.value || completed.value) {
    activated.value = false
    hideChip.value = false
    booking.value = await getBooking({ id: route.params.id })

    return
  }
  booking.value = cloneDeep(
    useArrayFind(fromDraft ? drafts.value : bookings.value, i => i.id === route.params.id).value,
  )
}

const onSave = async () => {
  isSaveLoading.value = true
  const original_booking = bookings.value.find(val => val.id === route.params.id)
  const updatedObj = pickBy(booking.value, (value, key) => !isEqual(value, original_booking[key]))
  // booking.value.loadingDate = moment(booking.value.loadingDate).endOf('day').format()
  // booking.value.preferredDate = moment(booking.value.preferredDate).endOf('day').format()
  if (activated) {
    if (expired.value) {
      // await reactivateBooking(booking.value)
      // await router.push({ name: 'dashboard' })
      // activated.value = false

      return
    }
    if (completed.value) {
      // await duplicateBooking(booking.value)
      // await router.push({ name: 'dashboard' })
      // activated.value = false

      return
    }
  }
  await updateBooking(updatedObj, booking.value?.ids, fromDraft ? 'drafts' : 'bookings')
  await new Promise(resolve => setTimeout(resolve, 1000))

  await router.push({ name: 'dashboard' })
  isSaveLoading.value = false
}
const validateExpiryDates = () => {
  validExpiryDate.value = validateExpiryDate(bookings?.value, booking.value)
}
const removeLoadingDate = id => {
  console.log('remove booking dia', id)
  // const index = bookings.value.findIndex(i => i.id === id)
  // if (index > -1) {
  //   newBookings.value.splice(index, 1)
  // }
}
onMounted(async () => {
  loading.value = true
  await getBookings(fromDraft ? { draft: true } : {})
  await getBookings({})
  bookings.value = useBookingsStore().bookings
  if (fromHistory) {
    booking.value = await getBooking({ id: route.params.id })
    if (queryParams.activated) {
      animate()
    }
  } else if (fromDraft) {
    booking.value = await getBooking({ id: route.params.id, draft: true })
  } else {
    booking.value = cloneDeep(bookings.value.find(val => val.id === route.params.id))
    // await getBooking({ id: route.params.id })
  }

  yards.value = workDetailsStore.yards
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
              {{ booking.status === statuses.completed ? '(Completed)' : '' }}
              {{ booking.status === statuses.expired ? '(Expired)' : '' }}
            </span>
          </Typography>
          <IconButton
            icon="mdi-link"
            size="22"
            variant="plain"
            :color="getColor('iconButton-1')"
          />
          <IconButton
            v-if="!pending"
            icon="mdi-delete"
            size="22"
            variant="plain"
            :color="getColor('iconButton-1')"
            @click="openRemoveDialog"
          />
          <Button
            v-if="!(pending || expired || completed)"
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
            :disabled="pending || expired || (completed && !activated)"
          />
          <Autocomplete
            v-model="booking.line"
            :items="getAllLines()"
            label="SSL *"
            required
            item-title="label"
            item-value="id"
            return-object
            :disabled="pending || expired || completed"
          />
          <Textfield
            v-model.trim="booking.commodity"
            label="Commodity*"
            required
            :disabled="pending || expired || completed"
          />

          <!-- <Datepicker
            :key="booking.preferredDate"
            :picked="booking.preferredDate ? moment(booking.preferredDate).toDate() : null"
            label="Preferred carrier window"
            :disabled="!activated && (pending || expired || completed)"
            :class="{ 'pointer-events-none': !activated && (expired || completed) }"
            :upper-limit="booking.loadingDate && new Date(booking.loadingDate)"
            :lower-limit="currentDate"
            @onUpdate="updatePreferredDate"
          /> -->
          <Autocomplete
            v-model="booking.location"
            :items="
              yards.map(yard => ({
                address: yard.value,
                geohash: yard.geohash,
                label: yard.label,
                lat: yard.lat,
                lng: yard.lng,
                details: yard.details,
              }))
            "
            label="Yard label *"
            item-title="label"
            item-value="address"
            return-object
            required
            :disabled="pending || expired || completed"
            @update:modelValue="value => (booking.weight = value.details?.averageWeight || null)"
          />
          <Textfield
            v-model.number="booking.weight"
            label="Average Weight*"
            type="number"
            :rules="[rules.containers, rules.averageWeight]"
            required
            :disabled="pending || expired || completed"
          />
          <Select
            v-model="booking.insurance"
            :items="insuranceItems"
            label="Minimum Insurance*"
            required
            item-title="label"
            item-value="id"
            return-object
            :disabled="pending || expired || completed"
          />
          <TextFieldWithSelector
            v-model.number="booking.estimatedRate"
            type="number"
            label="Target rate*"
            :items="['All in rate', 'Linehaul + FSC Only']"
            return-object="true"
            :rules="[rules.containers]"
            @onSelect="value => (booking.estimatedRateType = value)"
          />
          <Autocomplete
            v-model="booking.size"
            :items="containersSizes"
            label="Equipment type*"
            :multiple="booking.flexibleBooking"
            item-title="label"
            item-value="size"
            :menu-props="{ maxHeight: 350 }"
            class="h-fit"
            :error-messages="validateFlexibleSizes(booking.size, booking.flexibleBooking)"
          >
            <template #prepend-item>
              <div class="mt-3 ml-5">
                <Checkbox
                  v-model="booking.flexibleBooking"
                  label="Flexible booking"
                  @change="updateSize"
                />
                <Typography
                  type="w-3/5 text-body-xs-regular ml-9 mt-1.5 -pr-4"
                  :color="getColor('textSecondary')"
                >
                  Allows more than 1 equipment type to be chosen (maximum of 2)
                </Typography>
              </div>
              <Divider class="w-[calc(100%+16px)] mt-3 -ml-2" />
            </template>
          </Autocomplete>

          <div class="grid grid-cols-subgrid gap-6 col-span-2 md:col-span-3 relative">
            <Typography type="text-body-xs-semibold col-span-2 md:col-span-3 -mb-2">
              Loading dates
            </Typography>
            <template
              v-for="(d, index) in booking.details"
              :key="d.id"
            >
              <Datepicker
                :picked="d.date"
                label="Loading date *"
                typeable
                :lower-limit="currentDate"
                :error-messages="validateExpiryDates(index)"
                :rules="[rules.required]"
                @onUpdate="value => updateExpiryDate(value, index)"
              />
              <Textfield
                v-model.number="d.containers"
                label="Number of containers*"
                :rules="[rules.containers]"
                type="number"
                required
                class="h-fit"
              />
              <div class="relative">
                <AutocompleteScac
                  :scac-list="{ list: [...d.scacs] || [] }"
                  :menu-btn="false"
                  :rules="[rules.required]"
                  class="w-3/4"
                />
                <!-- <IconButton
                  v-if="index"
                  icon="mdi-close"
                  class="absolute top-0 right-0"
                  @click="removeLoadingDate(d.id)"
                >
                  <Tooltip> Remove loading date</Tooltip>
                </IconButton> -->
              </div>
            </template>
          </div>

          <!-- <RadioGroup
            v-model="booking.estimatedRateType"
            inline
            class="mt-3"
          >
            <Radio
              value="All in rate"
              label="All in rate"
              :disabled="pending || expired || completed"
              class="mr-6"
            />
            <Radio
              value="Linehaul + FSC Only"
              label="Linehaul + FSC Only"
              :disabled="pending || expired || completed"
            />
          </RadioGroup> -->
          <!-- <Select
            v-model="booking.size"
            :items="containersSizes"
            label="Equipment type*"
            item-title="label"
            item-value="size"
            :multiple="booking.flexibleBooking"
            :disabled="pending || expired || completed"
            :error-messages="validateFlexibleSizes(booking.size, booking.flexibleBooking)"
          /> -->
          <!-- <Checkbox
            v-model="booking.flexibleBooking"
            label="Flexible Booking*"
            :disabled="pending || expired || completed"
            class="mt-3"
            @change="updateSize"
          /> -->
          <!-- <div>
            <AutocompleteScac
              :key="booking.scacList"
              :scac-list="booking.scacList"
              :disabled="pending || expired || completed"
            />
          </div> -->
        </VForm>
        <SaveCancelChanges
          v-if="!(expired || completed) || activated"
          :disabled="false"
          class="mt-10"
          :loading="isSaveLoading"
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
                :items="booking.timeLine"
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
      <ConfirmationDialog
        btn-name="Remove"
        @close="removeBookingDialog.show(false)"
        @onClickBtn="deleteFromPlatform(removeBookingDialog.data.id)"
      >
        <Typography>
          Are you sure you want to remove ref#
          <b>{{ removeBookingDialog.data.ref }}</b>
          from your bookings?
        </Typography>
      </ConfirmationDialog>
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
