<script setup>
import { getColor } from '~/helpers/colors'
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import { useBookingsStore } from '~/stores/bookings.store'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { storeToRefs } from 'pinia'
import { useBookingRulesStore } from '~/stores/bookingRules.store'
import { usePreferredTruckersStore } from '~/stores/preferredTruckers.store'
import DateRangePicker from 'vue3-daterange-picker'

import containersSizes from '~/fixtures/containersSizes.json'
import moment from 'moment'
import { useAlertStore } from '~/stores/alert.store'
import {
  checkContianersMaxLimit,
  checkPositiveInteger,
  checkUniqueDates,
  validateAverageWeight,
  validateExpiryDate,
  validateFlexibleSizes,
} from '~/helpers/validations-functions'
import { insuranceTypes } from '~/constants/settings'
import { deepCopy } from 'json-2-csv/lib/utils'
import { uid } from 'uid'
import { cloneDeep, isBoolean, isNull } from 'lodash'
import { useCommitmentsStore } from '~/stores/commitments.store'
import { getLocalTime } from '@qualle-admin/qutil/dist/date'
import { getTruckers } from '~/stores/helpers'

const props = defineProps({
  duplicate: Array,
  clickedOutside: Boolean,
})
const emit = defineEmits(['close', 'bookingCreated'])

const { createBooking, createDraft } = useBookingsStore()
const workDetailsStore = useWorkDetailsStore()
const bookingRulesStore = useBookingRulesStore()
const bookingsStore = useBookingsStore()
const alertStore = useAlertStore()
const commitmentStore = useCommitmentsStore()
const preferredTruckersStore = usePreferredTruckersStore()

const { preferredTruckers } = storeToRefs(preferredTruckersStore)
const { yards } = storeToRefs(workDetailsStore)
const { notGroupedBookings: bookings } = storeToRefs(bookingsStore)
const form = ref(null)
const insuranceItems = ref(insuranceTypes)
const bookingConfirmationDialog = ref(null)
const isLoading = ref(false)
const truckers = ref([])

const {
  ref: bookingRef,
  containers,
  line,
  commodity,
  loadingDate = props?.duplicate?.length && props.duplicate[0]?.loadingDate
    ? props.duplicate[0].loadingDate
    : null,
  loadingDateRange = props?.duplicate?.length && props.duplicate[0]?.loadingDateRange
    ? props.duplicate[0].loadingDateRange
    : {
        startDate: moment().format('YYYY-MM-DD'),
        endDate: moment().add(3, 'days').format('YYYY-MM-DD'),
      },
  location,
  weight,
  estimatedRateType,
  estimatedRate,
  flexibleBooking,
  size,
  scacList,
  newScacs,
  insurance,
} = deepCopy(props?.duplicate?.length ? props.duplicate[0] : {})
const loadingsDateCopy = props?.duplicate?.map(booking => {
  const i = deepCopy(booking)
  if (i.newScacs) {
    i.newScacs.map(obj => {
      if (obj.flexibleLoadingDate) {
        obj.loadingDate = null
      } else {
        obj.loadingDateRange = {
          startDate: moment().format('YYYY-MM-DD'),
          endDate: moment().add(3, 'days').format('YYYY-MM-DD'),
        }
      }
    })
  }
  return {
    id: uid(28),
    loadingDate: i.loadingDate,
    loadingDateRange: i?.loadingDateRange
      ? i.loadingDateRange
      : {
          startDate: moment().format('YYYY-MM-DD'),
          endDate: moment().add(3, 'days').format('YYYY-MM-DD'),
        },
    flexibleLoadingDate: i.flexibleLoadingDate || false,
    preferredDays: i?.preferredDays || null,
    containers: i.containers,
    scacList: i?.scacList || { list: [] },
    newScacs: i?.newScacs
      ? i?.newScacs
      : [
          {
            loadingDate: i.loadingDate,
            flexibleLoadingDate: i.flexibleLoadingDate || false,
            loadingDateRange: i.loadingDateRange,
            containers: i.containers,
            scac: i?.scacList.list[0],
          },
        ],
  }
})
const copyBooking = {
  ref: bookingRef,
  containers,
  line,
  commodity,
  loadingDate,
  loadingDateRange,
  location,
  weight,
  estimatedRateType,
  estimatedRate,
  flexibleBooking,
  size,
  scacList,
  insurance,
}
const emptyBooking = {
  ref: '',
  line: null,
  commodity: '',
  location: bookingRulesStore.rules.yard,
  weight: bookingRulesStore.rules.yard?.details?.overweight
    ? parseInt(bookingRulesStore.rules.yard?.details?.averageWeight)
    : null,
  estimatedRateType: 'All in rate',
  estimatedRate: null,
  flexibleBooking: false,
  size: '40 HC',
  insurance: '100,000',
}
const generateNewScacs = () => {
  const truckersList = cloneDeep(bookingRulesStore.rules?.truckers?.list)

  if (truckersList?.length) {
    return truckersList.map(val => ({
      scac: val,
      id: uid(16),
      preferredDays: null,
      loadingDate: null,
      flexibleLoadingDate: false,
      loadingDateRange: {
        startDate: moment().format('YYYY-MM-DD'),
        endDate: moment().add(3, 'days').format('YYYY-MM-DD'),
      },
      containers: null,
    }))
  }

  return [
    {
      id: uid(16),
      preferredDays: null,
      loadingDate: null,
      flexibleLoadingDate: false,
      loadingDateRange: {
        startDate: moment().format('YYYY-MM-DD'),
        endDate: moment().add(3, 'days').format('YYYY-MM-DD'),
      },
      containers: null,
      scac: null,
    },
  ]
}
const booking = ref(props?.duplicate ? copyBooking : emptyBooking)
const newBookings = ref(
  props.duplicate
    ? loadingsDateCopy
    : [
        {
          id: uid(28),
          loadingDate: null,
          loadingDateRange: {
            startDate: moment().format('YYYY-MM-DD'),
            endDate: moment().add(3, 'days').format('YYYY-MM-DD'),
          },
          flexibleLoadingDate: false,
          preferredDays: null,
          containers: null,
          scacList: cloneDeep(bookingRulesStore.rules.truckers),
          newScacs: generateNewScacs(),
        },
      ],
)
console.log(props?.duplicate, newBookings.value, 'bookings')
const confirmDraftsDialog = ref(null)
const { clickedOutside } = toRefs(props)
const confirmClickedOutside = ref(null)

const previousDate = ref(new Date())
previousDate.value.setDate(previousDate.value.getDate() - 1)
let currentDate = new Date()

const dateRange = {
  startDate: moment().format('YYYY-MM-DD'),
  endDate: moment().add(3, 'days').format('YYYY-MM-DD'),
}

const rules = {
  containers: value => checkPositiveInteger(value),
  averageWeight: value => validateAverageWeight(value, booking.value.location),
  required(value) {
    return value?.toString().trim() ? true : 'Required field'
  },
  validateDate: value => (isNull(value) ? true : validateExpiryDate(bookings?.value, value)),
  uniqueDate: () =>
    checkUniqueDates(newBookings.value) || 'Loading date already exists. Select another date.',
  containersMaxLimit: value => checkContianersMaxLimit(value),
}
const updateExpiryDate = (value, index, i) => {
  newBookings.value[index].newScacs.map(obj => {
    obj.loadingDate = moment(value).endOf('day').format()
  })
  newBookings.value[index].loadingDate = moment(value).endOf('day').format()
}
const updateExpiryRangeDate = (value, index, i) => {
  value.endDate = moment(value.endDate).endOf('day').format()
  value.startDate = moment(value.startDate).startOf('day').format()
  newBookings.value[index].newScacs.map(obj => {
    obj.loadingDateRange = value
  })
  newBookings.value[index].loadingDateRange = value
}
const updateSize = () => {
  booking.value.size = null
}
const updateLoadingDate = (booking, index, i) => {
  newBookings.value[index].flexibleLoadingDate = booking.flexibleLoadingDate || false
  if (booking.flexibleLoadingDate) {
    newBookings.value[index].newScacs.map(obj => {
      obj.loadingDate = null
    })
    newBookings.value[index].loadingDate = null
  } else {
    newBookings.value[index].newScacs.map(obj => {
      obj.loadingDateRange.startDate = moment().format('YYYY-MM-DD')
      obj.loadingDateRange.endDate = moment().add(3, 'days').format('YYYY-MM-DD')
    })
    newBookings.value[index].loadingDateRange.startDate = new Date()
    newBookings.value[index].loadingDateRange.endDate = null
  }
}
const isDisabled = computed(() => {
  let condition = false
  if (!props.duplicate) {
    const values = Object.values(booking.value)
    condition = values.some(i => {
      return isBoolean(i) ? false : !i
    })
  }
  if (!condition) {
    condition =
      form.value?.errors.length ||
      validateFlexibleSizes(booking.value.size, booking.value.flexibleBooking)?.length > 0
  }

  return condition
})
const isLoadingDatesFieldsEmpty = computed(() => {
  return cloneDeep(newBookings.value).some(object => {
    delete object?.preferredDays
    return Object.values(object.newScacs).some(value => {
      delete value?.preferredDays
      delete value?.scac

      if (value.flexibleLoadingDate) {
        delete value?.loadingDate
      } else {
        delete value.loadingDateRange
      }
      delete value.flexibleLoadingDate
      const test =
        value === null ||
        Object.values(value).some(i => {
          if (typeof i === 'object' && i !== null && 'startDate' in i && 'endDate' in i) {
            return isBoolean(i.startDate) && isBoolean(i.endDate)
              ? false
              : !i.startDate || !i.endDate
          }

          return isBoolean(i) ? false : !i
        })
      return test
    })
  })
})

// if true shows save to draft dialog
const isDirty = computed(() => {
  const values = Object.values(booking.value)

  return !values.some(i => (isBoolean(i) ? false : !i)) && form.value?.errors.length
})

const closeBookingDialog = () => {
  /*if (isDirty.value) {
    confirmDraftsDialog.value.show(true)
  } else emit('close')*/
  emit('close')
}
const addLoadingDate = () => {
  const truckers = cloneDeep(bookingRulesStore.rules?.truckers)
  newBookings.value.push({
    id: uid(16),
    loadingDate: null,
    flexibleLoadingDate: false,
    loadingDateRange: null,
    preferredDays: null,
    containers: null,
    scacList: truckers,
    newScacs: generateNewScacs(),
  })
}
const addScac = id => {
  let booking = newBookings.value.find(booking => booking.id === id)
  if (booking) {
    booking.newScacs = booking.newScacs ? booking.newScacs : []
    booking.newScacs.push({
      id: uid(16),
      preferredDays: null,
      flexibleLoadingDate: booking.flexibleLoadingDate,
      loadingDate: booking.loadingDate,
      loadingDateRange: booking.loadingDateRange,
      containers: null,
      scac: null,
    })
  }
}
const removeLoadingDate = id => {
  const index = newBookings.value.findIndex(i => i.id === id)
  if (index > -1) {
    newBookings.value.splice(index, 1)
  }
}
const removeScac = bDetails => {
  let booking = newBookings.value.find(booking => {
    if (booking.flexibleLoadingDate) {
      return (
        booking.loadingDateRange.startDate === bDetails.loadingDateRange.startDate &&
        booking.loadingDateRange.endDate === bDetails.loadingDateRange.endDate
      )
    } else {
      return booking.loadingDate === bDetails.loadingDate
    }
  })

  if (booking) {
    const index = booking.newScacs.findIndex(i => i.id === bDetails.id)

    if (index > -1) {
      booking.newScacs.splice(index, 1)
    }
  }
  if (selectedScacs.value.includes(bDetails.scac)) {
    selectedScacs.value = selectedScacs.value.filter(scac => scac !== bDetails.scac)
  }
}
const saveDraft = async () => {
  let check = await validateScac()

  if (check) {
    alertStore.warning({ content: 'Please update trucker SCACs in preferred truckers list.' })
  } else {
    await createDraft(booking.value, newBookings.value).then(() => emit('bookingCreated'))
    emit('close')
  }
}
//validate whether given scac is in prefererd scaclist or not
const validateScac = () => {
  const truckersList = truckers.value || []

  return newBookings.value.some(iBooking => {
    const scacList = iBooking.newScacs.map(newScac => newScac.scac)
    return scacList.some(scac => scac !== null && !truckersList.includes(scac))
  })
}
const saveBooking = async () => {
  let check = await validateScac()

  if (check) {
    alertStore.warning({ content: 'Please update trucker SCACs in preferred truckers list.' })
  } else {
    isLoading.value = true
    const commitmentsList = await commitmentStore.getExpiredCommitments(
      booking.value.location.geohash,
    )
    if (commitmentsList?.length) {
      bookingConfirmationDialog.value.show(true)
      bookingConfirmationDialog.value.data = commitmentsList
      isLoading.value = false
    } else {
      createBooking(booking.value, newBookings.value).then(() => emit('bookingCreated'))
      // await bookingsStore.getBookings({})
      isLoading.value = true
      emit('close')
      // await bookingsStore.getBookings({})
    }
  }
}
const updateRef = async e => {
  if (form.value.errors.length) {
    form.value.validate()
    if (!e) {
      await nextTick()
      form.value.validate()
    }
  }
}
let selectedScacs = []
const availableScacs = (index, newScacs) => {
  selectedScacs.value = newScacs.map(obj => obj.scac)
  const selected = selectedScacs.value.filter((_, id) => id !== index)
  return truckers.value.filter(scac => !selected.includes(scac))
}
const handleScacChange = selectedBooking => {
  let booking = newBookings.value.find(booking => {
    if (booking.flexibleLoadingDate) {
      return (
        booking.loadingDateRange.startDate === selectedBooking.loadingDateRange.startDate &&
        booking.loadingDateRange.endDate === selectedBooking.loadingDateRange.endDate
      )
    } else {
      return booking.loadingDate === selectedBooking.loadingDate
    }
  })
  if (booking) {
    booking.newScacs = booking.newScacs ? booking.newScacs : []
    selectedScacs.value = booking.newScacs.map(dt => dt.scac).filter(scac => scac)
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
const updateWeightAndCommodity = yard => {
  booking.value.weight = yard.details?.averageWeight
    ? parseInt(yard.details?.averageWeight)
    : booking.value.weight
    ? ''
    : null
  booking.value.commodity = yard.commodity
}

onMounted(async () => {
  await workDetailsStore.getYards()
  truckers.value = preferredTruckers.value.map(preferredTrucker => preferredTrucker.scac)
  booking.value.commodity = booking.value.commodity
    ? booking.value.commodity
    : bookingRulesStore.rules.yard?.label
    ? yards.value?.find(yard => yard.label === bookingRulesStore.rules.yard.label)?.commodity
    : ''
})

/*watch(clickedOutside, () => {
  if (isDirty.value) {
    confirmDraftsDialog.value.show(true)
  } else emit('close')
})*/
</script>

<template>
  <VRow
    no-gutters
    justify="space-between"
    align="center"
    class="mb-8"
  >
    <Typography
      type="text-h1"
      :color="getColor('textPrimary')"
    >
      Create booking
    </Typography>
    <IconButton
      icon="mdi-close"
      @click="closeBookingDialog"
    />
  </VRow>
  <VForm
    ref="form"
    class="flex justify-center flex-col styleCreateBookingDialog"
    @submit.prevent="saveBooking"
  >
    <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
      <Typography type="text-body-xs-semibold col-span-2 md:col-span-3 -mb-2">
        General information
      </Typography>
      <Textfield
        v-model.trim="booking.ref"
        label="Booking ref*"
        :rules="[rules.required, rules.validateDate(null)]"
        @update:modelValue="updateRef"
      />
      <Autocomplete
        v-model="booking.line"
        :items="getAllLines()"
        label="SSL *"
        required
        item-title="label"
        item-value="id"
        return-object
        class="h-fit"
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
            details: yard.details,
            commodity: yard.commodity,
          }))
        "
        label="Yard label *"
        required
        item-title="label"
        item-value="address"
        return-object
        class="h-fit"
        @update:modelValue="updateWeightAndCommodity"
      />
      <Textfield
        v-model.trim="booking.commodity"
        label="Commodity*"
        required
        class="h-fit"
      />
      <Textfield
        v-model.number="booking.weight"
        label="Average weight*"
        type="number"
        :rules="[rules.containers, rules.averageWeight]"
        required
        class="h-fit"
      />
      <Select
        v-model="booking.insurance"
        :items="insuranceItems"
        label="Minimum Insurance*"
        required
        item-title="label"
        item-value="id"
        return-object
        class="h-fit"
      />
      <div>
        <TextFieldWithSelector
          v-model.number="booking.estimatedRate"
          type="number"
          label="Target rate*"
          :items="['All in rate', 'Linehaul + FSC Only']"
          return-object="true"
          select-width="197px"
          :rules="[rules.containers]"
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
        :menu-props="{ maxHeight: 350, width: '200' }"
        :rules="[rules.required]"
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
              type="text-body-xs-regular ml-8 mt-1 -pr-4"
              :color="getColor('textSecondary')"
              class="leading-4"
            >
              Allows more than 1 equipment type to be chosen (maximum of 2)
            </Typography>
          </div>
          <Divider class="mt-3 mb-1.5" />
        </template>
      </Autocomplete>
    </div>
    <div class="grid grid-cols-subgrid gap-8 md:grid-cols-5 col-span-1 md:col-span-4 relative mt-6">
      <Typography type="text-body-xs-semibold col-span-2 md:col-span-5 -mb-2">
        Loading dates
      </Typography>
      <template
        v-for="(d, index) in newBookings"
        :key="d.id"
      >
        <div
          class="mt-4 md:!mt-0"
          style="display: contents"
        >
          <template
            v-for="(dt, i) in d?.newScacs"
            :key="dt.id"
          >
            <div
              v-if="i === 0"
              class="pt-3"
            >
              <Checkbox
                v-model="dt.flexibleLoadingDate"
                label="Flexible Loading date"
                @change="updateLoadingDate(dt, index, i)"
              />
            </div>
            <div
              v-else
              class="w-1/6"
            ></div>
            <Datepicker
              v-if="i === 0 && !dt.flexibleLoadingDate"
              :picked="dt.loadingDate"
              label="Loading date *"
              typeable
              location="top"
              :lower-limit="previousDate"
              :error-messages="validateExpiryDate(bookings, { ...d, ref: booking.ref })"
              :rules="[
                rules.required,
                rules.validateDate({ ...d, ref: booking.ref }),
                rules.uniqueDate,
              ]"
              class="mb-2"
              @onUpdate="value => updateExpiryDate(value, index, i)"
            />
            <div
              v-else-if="i === 0 && dt.flexibleLoadingDate"
              class="pt-1"
            >
              <DateRangePicker
                :opens="'right'"
                :dateRange="dt.loadingDateRange"
                :minDate="previousDate"
                :autoApply="true"
                :ranges="false"
                @select="value => updateExpiryRangeDate(value, index, i)"
                class="mb-2"
              >
              </DateRangePicker>
            </div>
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
            />
            <div class="relative mt-4 md:!mt-0">
              <Autocomplete
                v-model="dt.scac"
                required
                :items="availableScacs(i, d.newScacs)"
                label="Choose trucker by SCAС "
                :menu-props="{ maxHeight: 300 }"
                @update:modelValue="handleScacChange(dt)"
                class="w-4/5 lg:w-10/12 xl:w-11/12"
              />
              <Button
                v-if="(dt.loadingDateRange || dt.loadingDate) && i + 1 === d.newScacs.length"
                :variant="(dt.loadingDateRange || dt.loadingDate) && dt.scac ? 'plain' : 'gray'"
                prepend-icon="mdi-plus"
                class="mt-2.5 mr-auto"
                :disabled="!((dt.loadingDateRange || dt.loadingDate) && dt.scac)"
                @click="addScac(d.id)"
              >
                add scac
              </Button>
            </div>
            <div class="relative mt-4 md:!mt-0">
              <IconButton
                icon="mdi-close"
                class="right-0"
                @click="removeScac(dt)"
                v-if="i !== 0"
              >
                <Tooltip> Remove Scac</Tooltip>
              </IconButton>
              <IconButton
                v-if="index && !i"
                icon="mdi-delete-forever-outline"
                class="right-0"
                @click="removeLoadingDate(d.id)"
              >
                <Tooltip> Remove loading date</Tooltip>
              </IconButton>
            </div>
          </template>
        </div>
      </template>
    </div>
    <Button
      variant="plain"
      prepend-icon="mdi-plus"
      class="mt-2.5 mr-auto"
      @click="addLoadingDate"
    >
      add loading date
    </Button>
    <div class="flex justify-center gap-5 mt-10">
      <Button
        variant="outlined"
        class="w-fit"
        :disabled="isDisabled || isLoadingDatesFieldsEmpty || isLoading"
        @click="saveDraft"
      >
        Save as draft
      </Button>
      <Button
        type="submit"
        class="w-fit"
        :disabled="isDisabled || isLoadingDatesFieldsEmpty"
        :loading="isLoading"
      >
        Create
      </Button>
    </div>
  </VForm>
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
  <!--
    <Dialog
    ref="confirmDraftsDialog"
    class="max-w-[450px] md:max-w-[560px]"
    >
    <template #text>
    <VRow
    no-gutters
    justify="space-between"
    align="center"
    class="flex-nowrap mb-8"
    >
    <Typography> Do you want to keep the bookings in Drafts?</Typography>
    <IconButton
    icon="mdi-close"
    class="-mt-1"
    @click="confirmDraftsDialog.show(false)"
    />
    </VRow>
    <div class="grid sm:grid-cols-2 grid-cols-1 gap-6">
    <Button
    class="w-full"
    @click="saveDraft"
    >
    save
    </Button>
    <Button
    variant="outlined"
    class="w-full"
    @click="emit('close')"
    >
    cancel
    </Button>
    </div>
    </template>
    </Dialog>
  -->
</template>
