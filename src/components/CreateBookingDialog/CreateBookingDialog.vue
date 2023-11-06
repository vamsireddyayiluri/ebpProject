<script setup>
import { getColor } from '~/helpers/colors'
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import { useBookingsStore } from '~/stores/bookings.store'

const props = defineProps({
  clickedOutside: Boolean,
})

const emit = defineEmits(['close'])
const { createBooking, createDraft } = useBookingsStore()
const booking = ref({
  ref: null,
  containers: null,
  line: null,
  bookingExpiry: null,
  preferredDate: null,
  location: null,
  equipmentType: null,
  scacList: { list: [] },
})
const confirmDraftsDialog = ref(null)
const { clickedOutside } = toRefs(props)

const rules = {
  equipmentType: value => {
    if (value.length >= 2) return true
    else return 'Min length 2'
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

  return values.some(i => !i) || !booking.value.scacList.list.length
})
const isDirty = () => {
  const values = Object.values(booking.value)
  values.pop()

  return values.some(i => i) || booking.value.scacList.list.length
}
const closeBookingDialog = () => {
  if (isDirty()) {
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
  confirmDraftsDialog.value.show(true)
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
    <div class="grid sm:grid-cols-2 grid-cols-1 gap-6 mb-1">
      <Textfield
        v-model="booking.containers"
        label="Number of containers*"
        type="number"
        required
      />
      <Select
        v-model="booking.line"
        :items="getAllLines()"
        label="SSL *"
        required
        item-title="label"
        item-value="type"
        return-object
      />
      <Datepicker
        :picked="booking.bookingExpiry"
        label="Booking expiry *"
        @onUpdate="updateExpiryDate"
      />
      <Datepicker
        :picked="booking.preferredDate"
        label="Preferred carrier window"
        @onUpdate="updatePreferredDate"
      />
      <Select
        v-model="booking.location"
        :items="[
          {
            address: '875 Blake Wilbur Dr, Palo Alto, CA 94304, USA',
            geohash: '9q9hgycyy',
            label: 'california',
            lat: 37.4357319,
            lng: -122.1762866,
          },
          {
            address: '3400 Bainbridge Ave, The Bronx, NY 10467, USA',
            geohash: 'dr72wcgnz',
            label: 'test2',
            lat: 40.8799534,
            lng: -73.878608,
          },
          {
            address: '11200 Iberia St, Mira Loma, CA 91752, USA',
            geohash: '9qh3t96uz',
            label: 'Mira Loma Yard',
            lat: 34.0213706,
            lng: -117.5276535,
          },
        ]"
        label="Yard label *"
        required
        item-title="label"
        item-value="address"
        return-object
        class="h-fit"
      />
      <Textfield
        v-model="booking.equipmentType"
        type="text"
        label="Equipment type*"
        hint="For e.g. 40 HC"
        persistent-hint
        :rules="[rules.equipmentType]"
      />
    </div>
    <AutocompleteScac :scac-list="booking.scacList" />
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
