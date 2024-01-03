<script setup>
import { getColor } from '~/helpers/colors'
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import { useBookingsStore } from '~/stores/bookings.store'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { storeToRefs } from 'pinia'
import { useBookingRulesStore } from '~/stores/bookingRules.store'
import containersSizes from '~/fixtures/containersSizes.json'
import { getLocalTime } from '@qualle-admin/qutil/dist/date'
import moment from 'moment'
import { useAlertStore } from '~/stores/alert.store'
import { filterMatchingObjects } from '~/helpers/filters'

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

const computedEntities = computed(() => bookings.value)

const booking = ref({
  ref: '',
  containers: null,
  line: null,
  bookingExpiry: null,
  preferredDate: null,
  location: bookingRulesStore.rules.yard,
  size: null,
  scacList: bookingRulesStore.rules.truckers,
})

const confirmDraftsDialog = ref(null)
const { clickedOutside } = toRefs(props)

const currentDate = ref(new Date())

const rules = {
  size: value => {
    if (value.length >= 2) return true
    else return 'Min length 2'
  },
  containers: value => {
    if (value <= 0 || !Number.isInteger(value)) {
      return 'Value should be positive integer'
    } else {
      return true
    }
  },
}
const updateExpiryDate = value => {
  booking.value.bookingExpiry = value
  if (bookingRulesStore?.rules?.timeForTruckersFromMarketplace) {
    booking.value.preferredDate = moment(value)
      .subtract(bookingRulesStore?.rules?.timeForTruckersFromMarketplace, 'day')
      .format()
  }
}
const updatePreferredDate = value => {
  booking.value.preferredDate = value
}

const isDisabled = computed(() => {
  const values = Object.values(booking.value)
  values.pop()
  let condition = values.some(i => !i) || !booking.value.scacList.list.length

  condition = condition || !(rules.containers(booking.value.containers) === true)
  if (!condition) {
    condition = condition || !validateExpiryDate()
  }
  return condition
})
const isDirty = computed(() => {
  const values = Object.values(booking.value)
  values.pop()
  let condition = !values.some(i => !i)
  if (condition) {
    condition = condition && booking.value.scacList.list.length > 0
  }
  return condition
})

// Checking expiry date with ref is already exists or not
const validateExpiryDate = () => {
  if (
    computedEntities.value.find(
      val =>
        moment(val?.bookingExpiry).startOf('day').isSame(booking.value.bookingExpiry) &&
        val?.ref?.trim() === booking.value.ref?.trim() &&
        val.id !== booking.value.id,
    )
  ) {
    alertStore.warning({
      content:
        'Booking expiry date with booking number already exists. Update booking expiry date to new date.',
    })
    return false
  } else {
    return true
  }
}

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
  <form
    class="w-mt-10 mx-auto"
    @submit.prevent="saveBooking"
  >
    <Textfield
      v-model="booking.ref"
      label="Booking ref*"
      required
      class="mb-6"
    />
    <div class="grid sm:grid-cols-2 grid-cols-1 gap-6 mb-6">
      <Textfield
        v-model.number="booking.containers"
        label="Number of containers*"
        :rules="[rules.containers]"
        type="number"
        required
      />
      <Select
        v-model="booking.line"
        :items="getAllLines()"
        label="SSL *"
        required
        item-title="label"
        item-value="id"
        return-object
      />
      <Datepicker
        :picked="booking.bookingExpiry"
        label="Booking Expiration *"
        @onUpdate="updateExpiryDate"
        :lowerLimit="(booking.preferredDate && new Date(booking.preferredDate)) || currentDate"
      />
      <Datepicker
        :picked="booking.preferredDate"
        label="Preferred carrier window"
        :key="booking.preferredDate"
        @onUpdate="updatePreferredDate"
        :upperLimit="booking.bookingExpiry && new Date(booking.bookingExpiry)"
        :lowerLimit="currentDate"
      />
      <Select
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
      <Select
        v-model="booking.size"
        :items="containersSizes"
        label="Equipment type*"
        item-title="label"
        item-value="size"
      />
    </div>
    <AutocompleteScac
      :scac-list="booking.scacList"
      :menu-btn="false"
    />
    <Button
      type="submit"
      class="w-full"
      :disabled="isDisabled"
    >
      Create
    </Button>
  </form>
  <Dialog
    ref="confirmDraftsDialog"
    class="max-w-[450px] md:max-w-[560px]"
  >
    <template #text>
      <VRow
        no-gutters
        justify="space-between"
        align="center"
        class="mb-8"
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
