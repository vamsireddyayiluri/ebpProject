<script setup>
import { getColor } from '~/helpers/colors'
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import { useBookingsStore } from '~/stores/bookings.store'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { storeToRefs } from 'pinia'
import { useBookingRulesStore } from '~/stores/bookingRules.store'
import { useAuthStore } from '~/stores/auth.store'

const props = defineProps({
  clickedOutside: Boolean,
})

const emit = defineEmits(['close'])

const { userData } = useAuthStore()
const { createBooking, createDraft } = useBookingsStore()
const workDetailsStore = useWorkDetailsStore()
const bookingRulesStore = useBookingRulesStore()

const { yards } = storeToRefs(workDetailsStore)

const booking = ref({
  ref: '',
  containers: null,
  line: null,
  bookingExpiry: null,
  preferredDate: null,
  location: null,
  size: null,
  scacList: { list: [] },
})

const confirmDraftsDialog = ref(null)
const { clickedOutside } = toRefs(props)

const rules = {
  size: value => {
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
onMounted(async () => {
  workDetailsStore.getYards()

  const bookingRules = await bookingRulesStore.getRules(userData.orgId)

  booking.value.location = bookingRules.value.defaultYard
  booking.value.scacList = bookingRules.value.preferredTruckersList.scacList
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
        item-value="id"
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
        :items="yards.map(yard => ({
          address: yard.value,
          geohash: yard.geohash,
          label: yard.label,
          lat: yard.lat,
          lng: yard.lng,
        }))"
        label="Yard label *"
        required
        item-title="label"
        item-value="address"
        return-object
        class="h-fit"
      />
      <Textfield
        v-model="booking.size"
        type="text"
        label="Equipment type*"
        hint="For e.g. 40 HC"
        persistent-hint
        :rules="[rules.size]"
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
