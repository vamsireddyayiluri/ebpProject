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
import { cloneDeep } from 'lodash'

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
  ref: '',
  line: null,
  commodity: '',
  preferredDate: null,
  location: bookingRulesStore.rules.yard,
  weight: bookingRulesStore.rules.yard?.details?.overweight
    ? bookingRulesStore.rules.yard?.details?.averageWeight
    : null,
  estimatedRateType: 'All in rate',
  flexibleBooking: false,
  size: '40 HC',
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
    values.splice(7, 1)
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
  values.splice(7, 1)

  return !values.some(i => !i) && form.value?.errors.length
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
    scacList: cloneDeep(bookingRulesStore.rules.truckers),
    ...booking.value,
  })
}
const removeLoadingDate = id => {
  const index = newBookings.value.findIndex(i => i.id === id)
  if (index > -1) {
    newBookings.value.splice(index, 1)
  }
}
const saveDraft = async () => {
  const validationData = await form.value.validate()
  if (validationData.valid) {
    updateDates()
    newBookings.value[0] = {
      ...booking.value,
      ...newBookings.value[0],
    }
    updateDates()
    newBookings.value.forEach(booking => {
      createDraft(booking)
    })
    confirmDraftsDialog.value.show(false)
    emit('close')
  }
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
      <Typography type="text-body-xs-semibold col-span-2 md:col-span-3 -mb-2">
        General information
      </Typography>
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
      <div>
        <TextFieldWithSelector
          v-model.number="booking.targetRate"
          type="number"
          label="Target rate*"
          :items="['All in rate', 'Linehaul + FSC Only']"
          return-object="true"
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
        :menu-props="{ maxHeight: 350 }"
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
              type="w-3/5 text-body-xs-regular ml-9 mt-1.5 -pr-4"
              :color="getColor('textSecondary')"
            >
              Allows more than 1 equipment type to be chosen (maximum of 2)
            </Typography>
          </div>
          <Divider class="w-[calc(100%+16px)] mt-3 -ml-2" />
        </template>
      </Autocomplete>
      <div class="grid grid-cols-subgrid gap-6 col-span-2 md:col-span-3 relative">
        <Typography type="text-body-xs-semibold col-span-2 md:col-span-3 -mb-2">
          Loading dates
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
              :rules="[rules.required]"
              class="w-3/4"
            />
            <IconButton
              v-if="index"
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
    <div class="flex justify-center gap-5 mt-10">
      <Button
        variant="outlined"
        class="w-fit"
        :disabled="isDisabled"
        @click="saveDraft"
      >
        Save as draft
      </Button>
      <Button
        type="submit"
        class="w-fit"
        :disabled="isDisabled"
      >
        Create
      </Button>
    </div>
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

<style lang="scss">
.styledTextFieldWithSelector {
  .select {
    width: 130%;

    .v-field__input {
      padding-inline-start: 0;
      padding-inline-end: 2px;
    }
  }
}
</style>
