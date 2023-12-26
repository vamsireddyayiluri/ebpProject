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

const validExpiryDate = ref(false)
const validPreferredDate = ref(false)

const rules = {
  size: value => {
    if (value.length >= 2) return true
    else return 'Min length 2'
  },
  containers: value => {
    if (value > 0) return true
    else return 'Value should be positive integer'
  },
}
const updateExpiryDate = value => {
  booking.value.bookingExpiry = value
}
const updatePreferredDate = value => {
  booking.value.preferredDate = value
}
const isDisabled = computed(() => {
  const values = Object.values(booking.value)
  values.pop()
  let condition = values.some(i => !i) || !booking.value.scacList.list.length

  if (!condition) {
    condition = condition || !validExpiryDate.value || !validPreferredDate.value
  }
  return condition
})
const isDirty = () => {
  const values = Object.values(booking.value)
  values.pop()

  return values.some(i => i) || booking.value.scacList.list.length
}

// Checking expiry date with ref is already exists or not
const validateExpiryDate = () => {
  if (
    computedEntities.value.find(
      val =>
        moment(val?.bookingExpiry).startOf('day').isSame(booking.value.bookingExpiry) &&
        val?.ref?.trim() === booking.value.ref?.trim(),
    )
  ) {
    validExpiryDate.value = false
    alertStore.warning({
      content:
        'Booking expiry date with booking number already exists. Update booking expiry date to new date.',
    })
  } else {
    validExpiryDate.value = true
  }
}
// Valdating prefered carrier window
const validatePreferredDate = () => {
  if (booking.value.preferredDate > booking.value.bookingExpiry) {
    validPreferredDate.value = false

    alertStore.warning({ content: 'Preferred date should not be more than booking expiry' })
    return 'Preferred date should not be more than booking expiry'
  } else {
    validPreferredDate.value = true
  }
}

const closeBookingDialog = () => {
  if (!isDisabled.value) {
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
  if (!isDisabled.value) {
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
        v-model="booking.containers"
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
        label="Booking expiry *"
        @onUpdate="updateExpiryDate"
        :error-messages="validateExpiryDate()"
      />
      <Datepicker
        :picked="booking.preferredDate"
        label="Preferred carrier window"
        @onUpdate="updatePreferredDate"
        :error-messages="validatePreferredDate()"
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
