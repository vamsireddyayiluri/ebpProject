<script setup>
import { Main } from '@layouts'
import { useAuthStore } from '~/stores/auth.store'
import { getColor } from '~/helpers/colors'
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import moment from 'moment-timezone'
import { useDisplay } from 'vuetify'
import { getBookingLoad } from '~/helpers/countings'
import { useBookingsStore } from '~/stores/bookings.store'
import { useCommitmentsStore } from '~/stores/commitments.store'
import { storeToRefs } from 'pinia'
import { statuses } from '~/constants/statuses'
import { cloneDeep, isEqual, pickBy, isNull, sumBy, differenceBy, omit, isEmpty } from 'lodash'
import container from '~/assets/images/container.png'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { useBookingRulesStore } from '~/stores/bookingRules.store'
import containersSizes from '~/fixtures/containersSizes.json'
import { useAlertStore } from '~/stores/alert.store'
import {
  checkPositiveInteger,
  validateExpiryDate,
  validateFlexibleSizes,
  checkCommittedValue,
  validateAverageWeight,
  checkUniqueDates,
  checkContianersMaxLimit,
} from '~/helpers/validations-functions'
import { getTruckers } from '~/stores/helpers'
import { insuranceTypes } from '~/constants/settings'
import { getLocalTime } from '@qualle-admin/qutil/dist/date'
import { getTimeLine } from '~/helpers/filters'
import { uid } from 'uid'
import { isBoolean } from '@vueuse/core'
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
  createBooking,
  createDraft,
  reactivateBooking,
  duplicateBooking,
  getBookingHistory,
  removeBookingFromNetwork,
} = useBookingsStore()
const commitmentStore = useCommitmentsStore()

const workDetailsStore = useWorkDetailsStore()
const bookingRulesStore = useBookingRulesStore()

const { yards } = storeToRefs(workDetailsStore)
const { bookings, drafts, notGroupedBookings: activeBookings } = storeToRefs(useBookingsStore())
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
const isPublishLoading = ref(false)
const originalBooking = ref(null)
const bookingConfirmationDialog = ref(null)
const confirmClickedOutside = ref(null)
const truckers = ref([])
const fromRemoveLoadingDate = ref(false)

const rules = {
  checkcommitted: value => checkCommittedValue(value, booking.value),
  averageWeight: value => validateAverageWeight(value, booking.value.location),
  containers: value => checkPositiveInteger(value),
  required(value) {
    return value?.toString().trim() ? true : 'Required field'
  },
  validateDate: value => (isNull(value) ? true : validateExpiryDate(activeBookings?.value, value)),
  uniqueDate: () =>
    checkUniqueDates(booking.value.details) || 'Loading date already exists. Select another date.',
  lessThanComitted: value =>
    value?.containers >= value?.committed || `Value should not be less than ${value.committed}`,
  containersMaxLimit: value => checkContianersMaxLimit(value),
}

const updateExpiryDate = (value, index) => {
  booking.value.details[index]?.newScacs?.map(obj => {
    obj.loadingDate = moment(value).endOf('day').format()
  })
  booking.value.details[index].loadingDate = moment(value).endOf('day').format()
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
const paused = computed(() => booking.value?.status === statuses.paused)

const handleBookingChanges = async () => {
  isPublishLoading.value = true
  const commitmentsList = await commitmentStore.getExpiredCommitments(
    booking.value.location.geohash,
  )
  if (fromDraft) {
    if (commitmentsList?.length) {
      bookingConfirmationDialog.value.show(true)
      bookingConfirmationDialog.value.data = commitmentsList
      isPublishLoading.value = false
    } else {
      const newBookingObj = differenceBy(booking.value.details, originalBooking.value.details, 'id')
      const res = await publishDraft(booking.value, newBookingObj)
      if (res === 'published') {
        router.push('/dashboard')
      }
      isPublishLoading.value = false
    }
  } else {
    const res = await removeFromNetwork(booking.value)
    if (res === 'deleted') {
      router.push('/dashboard')
    }
    isPublishLoading.value = false
  }
}
const openRemoveDialog = (index = 0, loadingDate = null) => {
  removeBookingDialog.value.show(true)
  removeBookingDialog.value.data = cloneDeep(booking.value)
  removeBookingDialog.value.data.index = index
  if (loadingDate) {
    removeBookingDialog.value.data.loadingDate = moment(loadingDate).format('MM-DD-YYYY')
  } else {
    fromRemoveLoadingDate.value = false
  }
}
const deleteFromPlatform = async index => {
  if (fromRemoveLoadingDate.value) {
    const collection = fromDraft ? 'drafts' : 'bookings'
    const res = await removeBookingFromNetwork(booking.value, index, collection)
    if (res === 'deleted') {
      router.push('/dashboard')
    }
  } else {
    await deleteBooking(booking.value.ids, fromDraft, fromHistory)
    router.push('/dashboard')
  }
}
const handleAction = async e => {
  if (e) {
    animate()
    if (completed.value) {
      booking.value.ref = null
    }
  }
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
const animate = async () => {
  activated.value = true
  setTimeout(async () => {
    hideChip.value = true
  }, 2000)
}
const validateRequiredFields = () => {
  return (
    !(booking.value.ref &&
    booking.value.commodity &&
    booking.value.insurance &&
    booking.value.weight &&
    rules.containers(booking.value.weight) === true &&
    booking.value.estimatedRate &&
    rules.containers(booking.value.estimatedRate) === true &&
    booking.value.size &&
    booking.value.size
      ? booking.value.size.length > 0
      : false && booking.value.estimatedRateType) ||
    validateFlexibleSizes(booking.value.size, booking.value.flexibleBooking)?.length > 0
  )
}

const isDisabledPublish = computed(() => {
  return validateRequiredFields() || form.value?.errors.length
})
const isLoadingDatesFieldsEmpty = computed(() => {
  return cloneDeep(booking.value.details).some(object => {
    if (object.newScacs) {
      delete object?.preferredDays
      return Object.values(object.newScacs).some(value => {
        delete value?.preferredDays
        delete value?.scac
        const test =
          value === null ||
          Object.values(value).some(i => {
            return isBoolean(i) ? false : !i
          })
        return test
      })
    }
  })
})
const validateBooking = computed(() => {
  if (fromEdit) {
    const selectedBooking = bookings.value.find(i => i.id === booking.value.id)
    booking.value.entities = selectedBooking?.entities
  }

  let condition = isEqual(booking.value, originalBooking.value)
  condition = condition || validateRequiredFields()
  condition = condition || form.value?.errors.length
  if (fromHistory) {
    condition =
      condition ||
      booking.value.details.some(val =>
        moment(val?.loadingDate).endOf('day').isBefore(moment().endOf('day')),
      )
  }

  if (!fromDraft && !fromHistory && !condition) {
    condition = condition || booking.value.details.some(val => val?.containers < val?.committed)
  }

  return condition
})
const cancelChanges = async () => {
  if (expired.value || completed.value) {
    activated.value = false
    hideChip.value = false
  }

  booking.value = cloneDeep(originalBooking.value)
}

const onSave = async () => {
  isSaveLoading.value = true

  // Getting newly added loading date object
  const bookingObj = differenceBy(booking.value.details, originalBooking.value.details, 'id')

  // booking.value.loadingDate = moment(booking.value.loadingDate).endOf('day').format()
  // booking.value.preferredDate = moment(booking.value.preferredDate).endOf('day').format()
  if (activated) {
    if (expired.value) {
      const commitmentsList = await commitmentStore.getExpiredCommitments(
        booking.value.location.geohash,
      )
      if (commitmentsList?.length) {
        bookingConfirmationDialog.value.show(true)
        bookingConfirmationDialog.value.data = commitmentsList
        isSaveLoading.value = false

        return
      } else {
        await reactivateBooking(booking.value)
        await router.push({ name: 'dashboard' })
        activated.value = false

        return
      }
    }
    if (completed.value) {
      // await duplicateBooking(booking.value)
      // await router.push({ name: 'dashboard' })
      // activated.value = false

      return
    }
  }

  let updatedBookingData = { ...booking.value }
  if (bookingObj.length) {
    const bookingData = omit(booking.value, ['details', 'ids'])
    if (fromDraft) {
      await createDraft(bookingData, bookingObj, true)
    } else {
      await createBooking(bookingData, bookingObj, true)
    }
    updatedBookingData.details = booking.value.details.filter(val =>
      bookingObj.some(obj => obj.id !== val.id),
    )
  }
  const updatedObj = pickBy(
    updatedBookingData,
    (value, key) => !isEqual(value, originalBooking.value[key]),
  )

  if (!isEmpty(updatedObj)) {
    await updateBooking(updatedObj, booking.value?.ids, fromDraft ? 'drafts' : 'bookings')
  }
  await new Promise(resolve => setTimeout(resolve, 1000))

  await router.push({ name: 'dashboard' })
  isSaveLoading.value = false
}

// checking active bookings loadingDate
const validateExpiryDates = index => {
  validExpiryDate.value = validateExpiryDate(activeBookings?.value, {
    ...booking.value.details[index],
    ref: booking.value.ref,
  })
}
const generateNewScacs = () => {
  const hasPreferredCarrierWindow = bookingRulesStore.rules?.preferredCarrierWindow > 0
  const truckersList = bookingRulesStore.rules?.truckers?.list

  if (hasPreferredCarrierWindow && truckersList?.length) {
    return truckersList.map(val => ({
      scac: val,
      id: uid(16),
      preferredDays: null,
      loadingDate: null,
      containers: null,
    }))
  }

  return [
    {
      id: uid(16),
      preferredDays: null,
      loadingDate: null,
      containers: null,
      scac: null,
    },
  ]
}
const addLoadingDate = () => {
  booking.value.details.push({
    id: uid(28),
    loadingDate: null,
    containers: null,
    scacList: cloneDeep(bookingRulesStore?.rules?.truckers),
    newScacs: generateNewScacs(),
  })
}
const addScac = loadingDate => {
  let selectedBooking = booking.value.details.find(booking => booking.loadingDate === loadingDate)
  if (selectedBooking) {
    selectedBooking.newScacs = selectedBooking.newScacs ? selectedBooking.newScacs : []
    selectedBooking.newScacs.push({
      id: uid(16),
      preferredDays: null,
      loadingDate: loadingDate,
      containers: null,
      scac: null,
    })
  }
}
const removeScac = bDetails => {
  let selectedBooking = booking.value.details.find(
    abooking => abooking.loadingDate === bDetails.loadingDate,
  )

  if (selectedBooking) {
    const index = selectedBooking.newScacs.findIndex(i => i.id === bDetails.id)

    if (index > -1) {
      selectedBooking.newScacs.splice(index, 1)
    }
  }
  if (selectedScacs.value.includes(bDetails.scac)) {
    selectedScacs.value = selectedScacs.value.filter(scac => scac !== bDetails.scac)
  }
}
let selectedScacs = []

const availableScacs = (index, newScacs) => {
  selectedScacs.value = newScacs.map(obj => obj.scac)
  const selected = selectedScacs.value.filter((_, id) => id !== index)
  return truckers.value.map(trucker => trucker.scac).filter(scac => !selected.includes(scac))
}
const handleScacChange = loadingDate => {
  let booking = booking.value.details.find(booking => booking.loadingDate === loadingDate)
  if (booking) {
    booking.newScacs = booking.newScacs ? booking.newScacs : []
    selectedScacs.value = booking.newScacs.map(dt => dt.scac).filter(scac => scac)
  }
}
const removeLoadingDate = async aBooking => {
  const index = booking.value.details.findIndex(i => i.id === aBooking.id)
  if (index > -1) {
    originalBooking.value.details[index]
    if (!originalBooking.value.details[index]) {
      booking.value.details.splice(index, 1)
    } else {
      fromRemoveLoadingDate.value = true
      openRemoveDialog(index, booking.value.details[index].loadingDate)
    }
  }
}

onMounted(async () => {
  loading.value = true
  await getBookings(fromDraft ? { draft: true } : {})
  let targetBookings
  if (fromHistory) {
    await getBookingHistory()
    targetBookings = useBookingsStore().pastBookings
  } else if (fromDraft) {
    targetBookings = useBookingsStore().drafts
  } else {
    targetBookings = useBookingsStore().bookings
  }

  // bookings.value = targetBookings
  originalBooking.value = cloneDeep(targetBookings.find(val => val.ids.includes(route.params.id)))
  booking.value = JSON?.parse(JSON?.stringify(originalBooking?.value))
  const loadingsDateCopy = booking.value?.details.map(iBooking => {
    const i = deepCopy(iBooking)
    return {
      id: i.id,
      loadingDate: i.loadingDate,
      preferredDays: i?.preferredDays || null,
      containers: i.containers,
      scacList: i?.scacList || { list: [] },
      committed: i.committed || 0,
      newScacs: i?.newScacs
        ? i?.newScacs
        : [
            {
              loadingDate: i.loadingDate,
              containers: i.containers,
              scac: i?.scacList.list[0] || null,
            },
          ],
    }
  })
  booking.value.details = loadingsDateCopy
  originalBooking.value = cloneDeep(booking.value)
  if (fromHistory && queryParams.activated) {
    animate()
  }
  await workDetailsStore.getYards()
  truckers.value = await getTruckers()

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
    <ProgressLinear
      v-if="loading"
      indeterminate
    />
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
            :loading="isPublishLoading"
            :disabled="fromDraft ? isDisabledPublish || isLoadingDatesFieldsEmpty : false"
            @click="handleBookingChanges"
          >
            {{ fromDraft ? 'publish' : 'Remove from network' }}
          </Button>
        </div>
        <Typography :color="getColor('textSecondary')">
          created by {{ userData.type }} {{ userData?.workerId ? '#' + userData.workerId : null }}
        </Typography>
        <!--        <div
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
        </div>-->
        <VForm
          ref="form"
          class="w-full md:w-3/4 grid grid-cols-2 md:grid-cols-3 gap-6 mt-10 [&>div]:h-fit"
          :class="{
            'md:w-full': drawer && !flyoutBottom,
          }"
          @submit.prevent
        >
          <div
            class="grid grid-cols-subgrid gap-6 md:grid-cols-3 col-span-2 md:col-span-4 relative"
          >
            <Textfield
              v-model.trim="booking.ref"
              label="Booking ref*"
              required
              :rules="[rules.required, rules.validateDate(null)]"
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

            <!--
            <Datepicker
            :key="booking.preferredDate"
            :picked="booking.preferredDate ? moment(booking.preferredDate).toDate() : null"
            label="Preferred carrier window"
            :disabled="!activated && (pending || expired || completed)"
            :class="{ 'pointer-events-none': !activated && (expired || completed) }"
            :upper-limit="booking.loadingDate && new Date(booking.loadingDate)"
            :lower-limit="currentDate"
            @onUpdate="updatePreferredDate"
            />
          -->
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
            <div class="col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-1">
              <TextFieldWithSelector
                v-model.number="booking.estimatedRate"
                type="number"
                label="Target rate*"
                :items="['All in rate', 'Linehaul + FSC Only']"
                return-object="true"
                :rules="[rules.containers]"
                :disabled="pending || expired || completed"
                select-width="197px"
                @onSelect="value => (booking.estimatedRateType = value)"
              />
            </div>
            <Autocomplete
              v-model="booking.size"
              :items="containersSizes"
              label="Equipment type*"
              :multiple="booking.flexibleBooking"
              item-title="label"
              item-value="size"
              :menu-props="{ maxHeight: 350 }"
              class="h-fit"
              :disabled="pending || expired || completed"
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
          </div>
          <div
            class="grid grid-cols-subgrid gap-6 md:grid-cols-4 col-span-2 md:col-span-4 relative"
          >
            <Typography type="text-body-xs-semibold col-span-2 md:col-span-4 -mb-2">
              Loading dates
            </Typography>
            <template
              v-for="(d, index) in booking.details"
              :key="d"
            >
              <div
                class="mt-4 md:!mt-0"
                style="display: contents"
              >
                <template
                  v-for="(dt, i) in d?.newScacs"
                  :key="i"
                >
                  <Datepicker
                    v-if="i === 0"
                    :picked="dt.loadingDate"
                    label="Loading date *"
                    typeable
                    location="top"
                    :lower-limit="currentDate"
                    :error-messages="validateExpiryDate(activeBookings, { ...d, ref: booking.ref })"
                    :rules="[
                      rules.required,
                      rules.validateDate({ ...d, ref: booking.ref }),
                      rules.uniqueDate,
                    ]"
                    class="mb-2"
                    @onUpdate="value => updateExpiryDate(value, index, i)"
                  />
                  <div
                    v-else
                    class="w-1/6"
                  ></div>
                  <Textfield
                    v-model.number="dt.containers"
                    label="Number of containers*"
                    :rules="[rules.containers, rules.containersMaxLimit]"
                    type="number"
                    required
                    class="h-fit"
                    :disabled="expired || completed || paused"
                  />
                  <div class="relative mt-4 md:!mt-0">
                    <Autocomplete
                      v-model="dt.scac"
                      :items="availableScacs(i, d.newScacs)"
                      label="Choose trucker by SCAС "
                      required
                      :menu-props="{ maxHeight: 300 }"
                      @update:modelValue="handleScacChange(dt.loadingDate)"
                      class="w-4/5 lg:w-10/12 xl:w-11/12"
                      :disabled="
                        bookingRulesStore.rules?.preferredCarrierWindow < 1 ||
                        expired ||
                        completed ||
                        paused ||
                        originalBooking.scacList.list.includes(dt.scac)
                      "
                    />
                    <Button
                      v-if="i + 1 === d.newScacs.length && !(expired || completed || paused)"
                      variant="plain"
                      prepend-icon="mdi-plus"
                      class="mt-2.5 mr-auto"
                      :disabled="!(dt.loadingDate && dt.scac)"
                      @click="addScac(dt.loadingDate)"
                    >
                      add scac
                    </Button>
                  </div>
                  <div class="relative mt-4 md:!mt-0">
                    <IconButton
                      v-if="d.newScacs?.length > 1 && !fromHistory"
                      icon="mdi-close"
                      class="right-0"
                      @click="removeScac(dt, index)"
                    >
                      <Tooltip> Remove Scac </Tooltip>
                    </IconButton>
                    <IconButton
                      v-if="booking?.details?.length > 1 && !fromHistory && !i"
                      icon="mdi-delete-forever-outline"
                      class="absolute top-0 right-0"
                      @click="removeLoadingDate(d)"
                    >
                      <Tooltip> Remove loading date</Tooltip>
                    </IconButton>
                  </div>
                </template>
              </div>
            </template>
          </div>
          <Button
            v-if="!(expired || completed || paused)"
            variant="plain"
            prepend-icon="mdi-plus"
            class="mr-auto"
            @click="addLoadingDate"
          >
            add loading date
          </Button>
        </VForm>
        <SaveCancelChanges
          v-if="!(expired || completed) || activated"
          :disabled="validateBooking || isLoadingDatesFieldsEmpty"
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
              :value="
                getBookingLoad(
                  sumBy(booking.details, 'committed'),
                  sumBy(booking.details, 'containers'),
                )
              "
              text="fullfilled"
              class="flex my-1 mx-auto"
            >
              {{
                getBookingLoad(
                  sumBy(booking.details, 'committed'),
                  sumBy(booking.details, 'containers'),
                )
              }}%
            </ProgressCircular>
          </div>
          <div class="statisticsTimeline">
            <Typography type="text-h4"> Booking timeline </Typography>
            <div class="timeline scrollbar">
              <Timeline
                :items="getTimeLine(booking?.timeLine)"
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
        @onClickBtn="deleteFromPlatform(removeBookingDialog.data.index)"
      >
        <Typography v-if="!fromRemoveLoadingDate">
          Are you sure you want to remove ref#
          <b>{{ removeBookingDialog.data.ref }}</b>
          from your bookings?
        </Typography>
        <Typography v-else>
          Are you sure you want to remove loading date#
          <b>{{ removeBookingDialog.data.loadingDate }}</b> with ref#
          <b>{{ removeBookingDialog.data.ref }}</b>
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
