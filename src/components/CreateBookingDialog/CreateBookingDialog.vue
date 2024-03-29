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
  validateAverageWeight,
  validateExpiryDate,
  validateFlexibleSizes,
} from '~/helpers/validations-functions'
import { insuranceTypes } from '~/constants/settings'
import { deepCopy } from 'json-2-csv/lib/utils'
import { uid } from 'uid'

const props = defineProps({
  duplicate: Object,
  clickedOutside: Boolean,
})

const emit = defineEmits(['close'])

const { createBooking, createDraft } = useBookingsStore()
const workDetailsStore = useWorkDetailsStore()
const bookingRulesStore = useBookingRulesStore()
const bookingsStore = useBookingsStore()
const alertStore = useAlertStore()

const { yards } = storeToRefs(workDetailsStore)
const { bookings } = storeToRefs(bookingsStore)
const form = ref(null)
const validExpiryDate = ref(false)
const insuranceItems = ref(insuranceTypes)

const {
  ref: bookingRef,
  containers,
  line,
  commodity,
  loadingDate,
  preferredDate,
  location,
  weight,
  estimatedRateType,
  estimatedRate,
  flexibleBooking,
  size,
  scacList,
  insurance,
} = deepCopy(props?.duplicate || {})

const copyBooking = {
  ref: bookingRef,
  containers,
  line,
  commodity,
  loadingDate,
  preferredDate,
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
  ref: 'test',
  line: {
    id: '59d8d49984308f11',
    label: 'ACL',
  },
  commodity: 'test',
  preferredDate: null,
  location: bookingRulesStore.rules.yard,
  weight: bookingRulesStore.rules.yard?.details?.overweight
    ? bookingRulesStore.rules.yard?.details?.averageWeight
    : 33333,
  estimatedRateType: 'All in rate',
  estimatedRate: 1,
  flexibleBooking: false,
  size: '40 OT',
  insurance: '100,000',
}
const booking = ref(props?.duplicate ? copyBooking : emptyBooking)
const newBookings = ref([
  {
    id: uid(16),
    loadingDate: null,
    containers: null,
    scacList: bookingRulesStore.rules.truckers,
  },
])
const confirmDraftsDialog = ref(null)
const { clickedOutside } = toRefs(props)

const currentDate = ref(new Date())

const rules = {
  containers: value => checkPositiveInteger(value),
  averageWeight: value => validateAverageWeight(value, booking.value.location),
  required(value) {
    return value?.toString().trim() ? true : 'Required field'
  },
}
const updateExpiryDate = (value, index) => {
  newBookings.value[index].loadingDate = moment(value).endOf('day').format()

  /*if (bookingRulesStore?.rules?.timeForTruckersFromMarketplace) {
    booking.value.preferredDate = moment(value)
      .subtract(bookingRulesStore?.rules?.timeForTruckersFromMarketplace, 'day')
      .format()
    if (moment(booking.value.preferredDate).endOf('day').isBefore(currentDate.value)) {
      booking.value.preferredDate = moment(currentDate.value).format()
    }
  }*/
}
const updatePreferredDate = value => {
  booking.value.preferredDate = moment(value).endOf('day').format()
}

const updateSize = () => {
  booking.value.size = null
}

const validateExpiryDates = useDebounceFn(() => {
  validExpiryDate.value = validateExpiryDate(bookings?.value, booking.value)
}, 200)

const isDisabled = computed(() => {
  let condition = false
  if (!props.duplicate) {
    const values = Object.values(booking.value)
    values.splice(8, 1)
    condition = values.some(i => !i)
  }
  if (!condition) {
    condition =
      form.value?.errors.length ||
      !validExpiryDate.value ||
      validateFlexibleSizes(booking.value.size, booking.value.flexibleBooking)?.length > 0
  }

  return condition
})

// if true shows save to draft dialog
const isDirty = computed(() => {
  const values = Object.values(booking.value)
  values.pop()
  values.splice(10, 1)

  return !values.some(i => !i) && booking.value.scacList?.list.length > 0
})

const closeBookingDialog = () => {
  if (isDirty.value) {
    confirmDraftsDialog.value.show(true)
  } else emit('close')
}
const updateDates = () => {
  booking.value.loadingDate = moment(newBookings.value.loadingDate).endOf('day').format()
  booking.value.preferredDate = moment(booking.value.preferredDate).endOf('day').format()
}
const addLoadingDate = () => {
  newBookings.value.push({
    id: uid(16),
    loadingDate: null,
    containers: null,
    scacList: bookingRulesStore.rules.truckers,
    ...booking.value,
  })
}
const removeLoadingDate = id => {
  const index = newBookings.value.findIndex(i => i.id === id)
  if (index > -1) {
    newBookings.value.splice(index, 1)
  }
}
const saveDraft = () => {
  updateDates()
  createDraft(booking.value)
  confirmDraftsDialog.value.show(false)
  emit('close')
}
const saveBooking = async () => {
  const validationData = await form.value.validate()
  if (validationData.valid) {
    updateDates()
    newBookings.value[0] = {
      ...booking.value,
      ...newBookings.value[0],
    }
    newBookings.value.forEach(booking => {
      createBooking(booking)
    })
    emit('close')
  }
}
watch(clickedOutside, () => {
  if (isDirty.value) {
    confirmDraftsDialog.value.show(true)
  } else emit('close')
})
onMounted(async () => {
  workDetailsStore.getYards()
})
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
    class="flex justify-center flex-col"
    @submit.prevent="saveBooking"
  >
    <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
      <Textfield
        v-model.trim="booking.ref"
        label="Booking ref*"
        required
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
        @update:modelValue="value => (booking.weight = value.details?.averageWeight || null)"
      />
      <Datepicker
        :key="booking.preferredDate"
        :picked="booking.preferredDate"
        label="Preferred carrier window"
        :lower-limit="currentDate"
        @onUpdate="updatePreferredDate"
      />
      <Textfield
        v-model.trim="booking.commodity"
        label="Commodity*"
        required
      />
      <Textfield
        v-model.number="booking.weight"
        label="Average weight*"
        type="number"
        :rules="[rules.containers, rules.averageWeight]"
        required
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
      <div class="grid grid-cols-subgrid gap-6 col-span-2 md:col-span-3">
        <Textfield
          v-model.number="booking.estimatedRate"
          label="Target rate*"
          :rules="[rules.containers]"
          type="number"
          required
          class="col-span-1"
        />
        <RadioGroup
          v-model="booking.estimatedRateType"
          inline
          class="mt-0 md:mt-3"
        >
          <Radio
            value="All in rate"
            label="All in rate"
            class="mr-6"
          />
          <Radio
            value="Linehaul + FSC Only"
            label="Linehaul + FSC Only"
          />
        </RadioGroup>
      </div>
      <div class="grid grid-cols-subgrid gap-6 col-span-2 md:col-span-3">
        <Select
          v-model="booking.size"
          :items="containersSizes"
          label="Equipment type*"
          item-title="label"
          item-value="size"
          :multiple="booking.flexibleBooking"
          :error-messages="validateFlexibleSizes(booking.size, booking.flexibleBooking)"
        />
        <Checkbox
          v-model="booking.flexibleBooking"
          label="Flexible booking"
          class="mt-3"
          @change="updateSize"
        />
      </div>
      <div class="grid grid-cols-subgrid gap-6 col-span-2 md:col-span-3 relative">
        <Typography type="text-body-xs-semibold col-span-2 md:col-span-3 -mb-3">
          Track details
        </Typography>
        <template
          v-for="(d, index) in newBookings"
          :key="d.id"
        >
          <Datepicker
            :picked="d.loadingDate"
            label="Loading date *"
            typeable
            :lower-limit="(booking.preferredDate && new Date(booking.preferredDate)) || currentDate"
            :error-messages="validateExpiryDates()"
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
              :scac-list="d.scacList"
              :menu-btn="false"
              class="w-3/4"
            />
            <IconButton
              icon="mdi-close"
              class="absolute top-0 right-0"
              @click="removeLoadingDate(d.id)"
            >
              <Tooltip> Remove loading date</Tooltip>
            </IconButton>
          </div>
        </template>
      </div>
    </div>
    <Button
      variant="plain"
      prepend-icon="mdi-plus"
      class="mr-auto"
      @click="addLoadingDate"
    >
      add loading date
    </Button>
    <Button
      type="submit"
      class="w-fit mt-10 ml-auto"
      :disabled="isDisabled"
    >
      Create
    </Button>
  </VForm>
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
</template>
