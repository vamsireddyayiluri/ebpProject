<script setup>
import { getColor } from '~/helpers/colors'
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import { useBookingsStore } from '~/stores/bookings.store'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { storeToRefs } from 'pinia'
import { useBookingRulesStore } from '~/stores/bookingRules.store'
import containersSizes from '~/fixtures/containersSizes.json'
import moment from 'moment'
import { useAlertStore } from '~/stores/alert.store'
import {
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
const emit = defineEmits(['close'])

const { createBooking, createDraft } = useBookingsStore()
const workDetailsStore = useWorkDetailsStore()
const bookingRulesStore = useBookingRulesStore()
const bookingsStore = useBookingsStore()
const alertStore = useAlertStore()
const commitmentStore = useCommitmentsStore()

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
  loadingDate,
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
  return {
    id: uid(28),
    loadingDate: i.loadingDate,
    preferredDays: i?.preferredDays || null,
    containers: i.containers,
    scacList: i?.scacList || { list: [] },
    newScacs: i?.newScacs
      ? i?.newScacs
      : [{ loadingDate: i.loadingDate, containers: i.containers, scac: i?.scacList.list[0] }],
  }
})
const copyBooking = {
  ref: bookingRef,
  containers,
  line,
  commodity,
  loadingDate,
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
const booking = ref(props?.duplicate ? copyBooking : emptyBooking)
const newBookings = ref(
  props.duplicate
    ? loadingsDateCopy
    : [
        {
          id: uid(28),
          loadingDate: null,
          preferredDays: null,
          containers: null,
          scacList: bookingRulesStore.rules.truckers,
          newScacs: generateNewScacs(),
        },
      ],
)
const confirmDraftsDialog = ref(null)
const { clickedOutside } = toRefs(props)
const confirmClickedOutside = ref(null)

const currentDate = ref(new Date())

const rules = {
  containers: value => checkPositiveInteger(value),
  averageWeight: value => validateAverageWeight(value, booking.value.location),
  required(value) {
    return value?.toString().trim() ? true : 'Required field'
  },
  validateDate: value => (isNull(value) ? true : validateExpiryDate(bookings?.value, value)),
  uniqueDate: () =>
    checkUniqueDates(newBookings.value) || 'Loading date already exists. Select another date.',
}
const updateExpiryDate = (value, index, i) => {
  newBookings.value[index].newScacs.map(obj => {
    obj.loadingDate = moment(value).endOf('day').format()
  })
  newBookings.value[index].loadingDate = moment(value).endOf('day').format()
}
const updateSize = () => {
  booking.value.size = null
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
      const test = value === null || (Array.isArray(value) && value.some(item => item === null))
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
    preferredDays: null,
    containers: null,
    scacList: truckers,
    newScacs: truckers?.list.length
      ? truckers?.list?.map(val => ({ scac: val }))
      : [
          {
            id: uid(16),
            preferredDays: null,
            loadingDate: null,
            containers: null,
            scac: null,
          },
        ],
  })
}
const addScac = loadingDate => {
  let booking = newBookings.value.find(booking => booking.loadingDate === loadingDate)
  if (booking) {
    booking.newScacs = booking.newScacs ? booking.newScacs : []
    booking.newScacs.push({
      id: uid(16),
      preferredDays: null,
      loadingDate: loadingDate,
      containers: null,
      scacList: { list: [] },
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
  let booking = newBookings.value.find(booking => booking.loadingDate === bDetails.loadingDate)

  if (booking) {
    const index = booking.newScacs.findIndex(i => i.id === bDetails.id)

    if (index > -1) {
      booking.newScacs.splice(index, 1)
    }
  }
}
const saveDraft = async () => {
  createDraft(booking.value, newBookings.value)

  emit('close')
}

const saveBooking = async () => {
  isLoading.value = true
  const commitmentsList = await commitmentStore.getExpiredCommitments(
    booking.value.location.geohash,
  )
  if (commitmentsList?.length) {
    bookingConfirmationDialog.value.show(true)
    bookingConfirmationDialog.value.data = commitmentsList
    isLoading.value = false
  } else {
    createBooking(booking.value, newBookings.value)
    isLoading.value = false
    emit('close')
    await bookingsStore.getBookings({})
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
let selectedScacs = ref(bookingRulesStore.rules?.truckers?.list)
const availableScacs = index => {
  const selected = selectedScacs.value.filter((_, id) => id !== index)
  return truckers.value.map(trucker => trucker.scac).filter(scac => !selected.includes(scac))
}
const handleScacChange = loadingDate => {
  let booking = newBookings.value.find(booking => booking.loadingDate === loadingDate)
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

onMounted(async () => {
  await workDetailsStore.getYards()
  truckers.value = await getTruckers()
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
          }))
        "
        label="Yard label *"
        required
        item-title="label"
        item-value="address"
        return-object
        class="h-fit"
        @update:modelValue="
          value =>
            (booking.weight = parseInt(value.details?.averageWeight) || booking.weight ? '' : null)
        "
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
    <div class="grid grid-cols-subgrid gap-6 md:grid-cols-4 col-span-2 md:col-span-4 relative">
      <Typography type="text-body-xs-semibold col-span-2 md:col-span-4 -mb-2">
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
            <Datepicker
              v-if="i === 0"
              :picked="dt.loadingDate"
              label="Loading date *"
              typeable
              location="top"
              :lower-limit="currentDate"
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
              v-else
              class="w-1/6"
            ></div>
            <Textfield
              v-model.number="dt.containers"
              label="Number of containers*"
              :rules="[rules.containers]"
              type="number"
              required
              class="h-fit"
            />
            <div class="relative mt-4 md:!mt-0">
              <Autocomplete
                v-model="dt.scac"
                :items="availableScacs(i)"
                label="Choose trucker by SCAС "
                :disabled="bookingRulesStore.rules?.preferredCarrierWindow < 1"
                :menu-props="{ maxHeight: 300 }"
                @update:modelValue="handleScacChange(dt.loadingDate)"
                class="w-4/5 lg:w-10/12 xl:w-11/12"
              />
              <Button
                v-if="
                  dt.loadingDate &&
                  i + 1 === d.newScacs.length &&
                  bookingRulesStore.rules?.preferredCarrierWindow > 0
                "
                variant="plain"
                prepend-icon="mdi-plus"
                class="mt-2.5 mr-auto"
                @click="addScac(dt.loadingDate)"
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
                v-if="!i"
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
        :disabled="isDisabled || isLoadingDatesFieldsEmpty"
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
