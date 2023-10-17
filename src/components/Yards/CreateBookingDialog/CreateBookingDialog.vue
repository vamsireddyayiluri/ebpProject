<script setup>
import { getColor } from '~/helpers/colors'
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'

const emit = defineEmits(['close', 'createBooking'])
const booking = ref({
  ref: null,
  containers: null,
  ssl: null,
  bookingExpiry: null,
  preferredDate: null,
  label: null,
  equipmentType: null,
})
const scac = ref([])
const preferredTruckersList = ref(['qqww', 'ggtr', 'asty'])
const confirmDraftsDialog = ref(null)
const sendDialog = ref(null)
const autocompleteValue = ref()

const updateExpiryDate = value => {
  booking.value.bookingExpiry = value
}
const updatePreferredDate = value => {
  booking.value.bookingExpiry = value
}
const scacList = ref([])
const selectScac = e => {
  scacList.value = useArrayMap(
    e,
    i => useArrayFind(preferredTruckersList.value, el => i === el).value,
  ).value
}
const removeScac = e => {
  scac.value = useArrayFilter(scac, i => i !== e).value
}
const sendToMarketplace = () => {
  sendDialog.value.show(false)
  autocompleteValue.value = 'Truckers from marketplace'
}
const saveDraft = () => {
  confirmDraftsDialog.value.show(false)
  emit('createBooking')
}
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
      @click="emit('close')"
    />
  </VRow>
  <form
    class="w-mt-10 mx-auto"
    @submit.prevent="confirmDraftsDialog.show(true)"
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
        v-model="booking.ssl"
        :items="getAllLines()"
        label="SSL"
        required
        item-title="label"
        item-value="type"
      />
      <Datepicker
        :picked="booking.bookingExpiry"
        label="Booking expiry *"
        required
        @onUpdate="updateExpiryDate"
      />
      <Datepicker
        :picked="booking.preferredDate"
        label="Preferred carrier window"
        @onUpdate="updatePreferredDate"
      />
      <Select
        v-model="booking.label"
        :items="['Good yard', 'Work yard', 'Farm yard']"
        label="Yard label *"
        required
        class="h-fit"
      />
      <Textfield
        v-model="booking.equipmentType"
        type="text"
        label="Equipment type*"
        hint="For e.g. 40 HC"
        persistent-hint
      />
    </div>
    <Autocomplete
      v-model="scac"
      :items="preferredTruckersList"
      placeholder="Choose truckers by SCAС *"
      multiple
      with-btn
      :value="autocompleteValue"
      @update:modelValue="selectScac"
    >
      <template #prepend-item>
        <div class="d-flex align-center ml-4">
          <SvgIcon
            icon="market"
            size="24"
            :color="getColor('iconButton-1')"
          />
          <Button
            variant="plain"
            @click="sendDialog.show(true)"
          >
            Truckers from marketplace
          </Button>
        </div>
      </template>
    </Autocomplete>
    <div class="min-h-[32px] my-4 flex gap-2">
      <template
        v-for="i in scacList"
        :key="i"
      >
        <Chip
          closable
          @click:close="removeScac(i)"
        >
          {{ i }}
        </Chip>
      </template>
    </div>
    <Button
      type="submit"
      class="w-full"
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
        <Typography>
          Do you want to keep the bookings in Drafts?
        </Typography>
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
          @click="confirmDraftsDialog.show(false)"
        >
          cancel
        </Button>
      </div>
    </template>
  </Dialog>
  <Dialog
    ref="sendDialog"
    class="max-w-[450px] md:max-w-[560px]"
  >
    <template #text>
      <VRow
        no-gutters
        justify="space-between"
        class="flex-nowrap mb-8"
      >
        <Typography>
          Are you sure you want to send this booking to truckers from marketplace?
        </Typography>
        <IconButton
          icon="mdi-close"
          class="-mt-1"
          @click="sendDialog.show(false)"
        />
      </VRow>
      <Button
        class="w-full"
        @click="sendToMarketplace"
      >
        send
      </Button>
    </template>
  </Dialog>
</template>
