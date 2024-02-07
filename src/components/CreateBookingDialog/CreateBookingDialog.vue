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
  validateExpiryDate,
  validateFlexibleSizes,
} from '~/helpers/validations-functions'
import { insuranceTypes } from '~/constants/settings'

const props = defineProps({
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

const computedEntities = computed(() => bookings.value)

const booking = ref({
  ref: '',
  containers: null,
  line: null,
  commodity: '',
  bookingExpiry: null,
  preferredDate: null,
  location: bookingRulesStore.rules.yard,
  weight: null,
  targetRateType: 'All in rate',
  targetRate: null,
  flexibleBooking: false,
  size: null,
  scacList: bookingRulesStore.rules.truckers,
  insurance: '100,000',
})

const confirmDraftsDialog = ref(null)
const { clickedOutside } = toRefs(props)

const currentDate = ref(new Date())

const rules = {
  containers: value => checkPositiveInteger(value),
}
const updateExpiryDate = value => {
  booking.value.bookingExpiry = value
  if (bookingRulesStore?.rules?.timeForTruckersFromMarketplace) {
    booking.value.preferredDate = moment(value)
      .subtract(bookingRulesStore?.rules?.timeForTruckersFromMarketplace, 'day')
      .format()
    if (moment(booking.value.preferredDate).endOf('day').isBefore(currentDate.value)) {
      booking.value.preferredDate = moment(currentDate.value).format()
    }
  }
}
const updatePreferredDate = value => {
  booking.value.preferredDate = value
}

const updateSize = () => {
  booking.value.size = null
}

const validateExpiryDates = () => {
  validExpiryDate.value = validateExpiryDate(bookings?.value, booking.value)
}

const isDisabled = computed(() => {
  const values = Object.values(booking.value)
  values.pop()
  values.splice(10, 1)
  let condition = values.some(i => !i) || !booking.value.scacList?.list?.length
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
const saveDraft = () => {
  createDraft(booking.value)
  confirmDraftsDialog.value.show(false)
  emit('close')
}
const saveBooking = async () => {
  booking.value.bookingExpiry = moment(booking.value.bookingExpiry).endOf('day').format()
  booking.value.preferredDate = moment(booking.value.preferredDate).endOf('day').format()
  createBooking(booking.value)
  emit('close')
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
    <div class="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
      <Textfield
        v-model.trim="booking.ref"
        label="Booking ref*"
        required
      />
      <Textfield
        v-model.number="booking.containers"
        label="Number of containers*"
        :rules="[rules.containers]"
        type="number"
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
          }))
        "
        label="Yard label *"
        required
        item-title="label"
        item-value="address"
        return-object
        class="h-fit"
      />
      <Datepicker
        :picked="booking.bookingExpiry"
        label="Loading date *"
        typeable
        clearable
        :lower-limit="(booking.preferredDate && new Date(booking.preferredDate)) || currentDate"
        :error-messages="validateExpiryDates()"
        @onUpdate="updateExpiryDate"
      />
      <Datepicker
        :key="booking.preferredDate"
        :picked="booking.preferredDate"
        label="Preferred carrier window"
        :upper-limit="booking.bookingExpiry && new Date(booking.bookingExpiry)"
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
        :rules="[rules.containers]"
        required
      />
      <Autocomplete
        v-model="booking.insurance"
        :items="insuranceItems"
        label="Minimum Insurance"
        required
        item-title="label"
        item-value="id"
        return-object
        class="h-fit"
      />
      <div class="grid grid-cols-subgrid gap-6 col-span-2 md:col-span-3">
        <Typography type="text-body-xs-semibold col-span-2 md:col-span-3 -mb-3">
          Target rate
        </Typography>
        <Textfield
          v-model.number="booking.targetRate"
          label="Target rate*"
          :rules="[rules.containers]"
          type="number"
          required
          class="col-span-1"
        />
        <RadioGroup
          v-model="booking.targetRateType"
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
        <Typography type="text-body-xs-semibold col-span-2 md:col-span-3 -mb-3">
          Equipment type
        </Typography>
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
          label="Flexible booking*"
          class="mt-3"
          @change="updateSize"
        />
      </div>
    </div>
    <AutocompleteScac
      :scac-list="booking.scacList"
      :menu-btn="false"
      class="grid grid-cols-2 md:grid-cols-3 gap-6"
    />
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
        <Typography> Do you want to keep the bookings in Drafts? </Typography>
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
