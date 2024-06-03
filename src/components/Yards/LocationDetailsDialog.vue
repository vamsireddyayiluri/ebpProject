<script setup>
import { getColor } from '~/helpers/colors'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { emailRegex } from '@qualle-admin/qutil/dist/patterns'
import { defaultOverWeight, maximumOverWeight } from '~/constants/settings'
import { cloneDeep, isEqual, isString } from 'lodash'
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from 'pinia'
import moment from 'moment-timezone'
import { cellMask } from '~/helpers/mask'
import { vMaska, Mask } from 'maska'
import { validateScheduler } from '~/helpers/validations-functions'
import { useBookingsStore } from '~/stores/bookings.store'

const props = defineProps({
  editedLocation: Object,
})
const emit = defineEmits(['close'])
const authStore = useAuthStore()
const bookingStore = useBookingsStore()
const workDetailsStore = useWorkDetailsStore()
const { saveVendorDetails, saveYardDetails, getVendorDetails } = workDetailsStore
const { vendorDetails } = storeToRefs(workDetailsStore)
const options = { mask: cellMask }

const details = ref(
  props.editedLocation
    ? props.editedLocation?.details?.customizedDetails
      ? { ...props.editedLocation?.details, label: props.editedLocation.label }
      : {
          ...vendorDetails.value,
          label: props.editedLocation.label,
          averageLoadTime: null,
          overweight: null,
          averageWeight: null,
        }
    : vendorDetails.value,
)
const initDetails = cloneDeep(details.value)
const isSecondaryContact = ref(details.value?.secondaryContactName || false)
const createDefaultTimeArray = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const defaultTimeFrom = {
    h: '9',
    mm: '30',
    A: 'AM',
  }
  const defaultTimeTo = {
    h: '5',
    mm: '30',
    A: 'PM',
  }

  return days.map(day => {
    return {
      day,
      from: defaultTimeFrom,
      status: false,
      to: defaultTimeTo,
    }
  })
}
const defaultTime = createDefaultTimeArray()
const getCurrentHours = () => {
  if (props.editedLocation) {
    if (props.editedLocation?.details?.customizedDetails) {
      return props.editedLocation.details.hoursOfOperation
    } else {
      if (vendorDetails.value.primaryContactName) {
        return cloneDeep(vendorDetails.value?.hoursOfOperation)
      } else {
        return defaultTime
      }
    }
  } else {
    return details.value?.hoursOfOperation || defaultTime
  }
}
const checkboxes = ref(getCurrentHours())
const form = ref(null)
const activeTimePicker = ref(null)
const notAfterToTime = ref({})
const notBeforeFromTime = ref({})
const loadTimes = ['0.5 hours', '1 hour', '1.5 hours']

const openTimePickerFrom = data => {
  activeTimePicker.value = checkboxes.value.find(d => d.day === data.day)
  notAfterToTime.value.hour = [
    [0, moment(activeTimePicker.value.to, 'h:mm A').format('ha').slice(0, -1)],
  ]
}
const openTimePickerTo = data => {
  activeTimePicker.value = checkboxes.value.find(d => d.day === data.day)
  notBeforeFromTime.value.hour = [
    [moment(activeTimePicker.value.from, 'h:mm A').format('ha').slice(0, -1), '11p'],
  ]
}
const onChangeFrom = (e, day) => {
  const currentTimePicker = checkboxes.value.find(d => d.day === day)
  if (moment(currentTimePicker.to, 'h:mm A').format('ha') === e.data.h + e.data.a) {
    notAfterToTime.value.minute = [[0, moment(currentTimePicker.to, 'h:mm A').format('mm')]]
  } else {
    notAfterToTime.value.minute = [[0, 60]]
  }
  checkboxes.value.map(d => {
    if (d.day === day) {
      d.from = e.displayTime
    }
  })
}
const onChangeTo = (e, day) => {
  const currentTimePicker = checkboxes.value.find(d => d.day === day)
  if (moment(currentTimePicker.from, 'h:mm A').format('ha') === e.data.h + e.data.a) {
    notBeforeFromTime.value.minute = [[moment(currentTimePicker.from, 'h:mm A').format('mm'), 60]]
  } else {
    notBeforeFromTime.value.minute = [[0, 60]]
  }
  checkboxes.value.map(d => {
    if (d.day === day) {
      d.to = e.displayTime
    }
  })
}
const resetTime = (e, item) => {
  if (!e) {
    const unselectedDay = checkboxes.value.find(i => i.day === item.day)
    unselectedDay.from = '9:30 AM'
    unselectedDay.to = '5:30 PM'
  }
}
const rules = {
  cell(value) {
    return (
      /^(\+\d{1,2}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value) ||
      'Invalid phone number format'
    )
  },
  email(value) {
    return emailRegex.test(value) || 'Invalid e-mail'
  },
  required(value) {
    return value?.toString().trim() ? true : 'Required field'
  },
  averageWeight(value) {
    return value < defaultOverWeight || value > maximumOverWeight
      ? `Weight must be b/w${defaultOverWeight} to ${maximumOverWeight}`
      : true
  },
  schedule() {
    const validationData = validateScheduler(checkboxes.value)

    return validationData.isValid || `Incorrect operation hours on ${validationData.day}`
  },
}
const isDirty = computed(() => !isEqual(details.value, initDetails))
const isDisabled = computed(
  () =>
    !!form.value?.errors.length ||
    form.value?.isValidating ||
    !isDirty.value ||
    isString(rules.schedule()),
)

const setDetails = async () => {
  const validationData = await form.value.validate()
  if (validationData.valid) {
    if (props.editedLocation) {
      saveYardDetails({
        ...props.editedLocation,
        label: details.value.label,
        details: { ...details.value, hoursOfOperation: checkboxes.value },
      })
      if (props.editedLocation.label !== details.value.label) {
        bookingStore.updateLocationLabelsInBookingsCommitmetns(
          authStore.orgData.orgId,
          props.editedLocation.geohash,
          details.value.label,
        )
      }
    } else {
      details.value.hoursOfOperation = checkboxes.value
      await saveVendorDetails(details.value)
    }
    emit('close')
  }
}
onMounted(async () => {
  await form.value.validate()
})
onUnmounted(() => {
  if (authStore.orgData?.vendorDetails) getVendorDetails()
})
</script>

<template>
  <VRow
    no-gutters
    justify="space-between"
    align="center"
    class="mb-8"
  >
    <Typography type="text-h2 md:text-h1">
      {{ `${editedLocation ? 'Edit' : 'Default'}  location details` }}
    </Typography>
    <IconButton
      icon="mdi-close"
      @click="emit('close')"
    />
  </VRow>
  <Typography
    :color="getColor('textSecondary')"
    class="mb-8"
  >
    {{
      editedLocation
        ? 'Customize the details for an individual location'
        : 'Create location details that will be shown by default. You can customize the details for an    individual location at any time.'
    }}
  </Typography>
  <VForm
    ref="form"
    validate-on="input"
    @submit.prevent="setDetails"
  >
    <Textfield
      v-if="editedLocation"
      v-model="details.label"
      label="Location label *"
      :rules="[rules.required]"
      class="w-full sm:w-full md:w-[calc(50%-8px)] mb-6"
    />
    <div
      class="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 content-start gap-4 [&>div]:h-fit"
    >
      <Textfield
        v-model="details.primaryContactName"
        label="Primary contact name *"
        :rules="[rules.required]"
      />
      <Textfield
        v-model="details.primaryContact"
        v-maska:[options]
        label="Primary contact number *"
        :rules="[rules.cell]"
      />
      <Textfield
        v-model="details.primaryContactEmail"
        label="Primary contact email *"
        placeholder="Primary@mail.com"
        :rules="[rules.email]"
      />
      <IconButton
        width="48"
        height="48"
        variant="outlined"
        :color="getColor('uiLine')"
        @click="isSecondaryContact = !isSecondaryContact"
      >
        <Icon
          :icon="isSecondaryContact ? 'mdi-minus' : 'mdi-plus'"
          size="24"
          :color="getColor('iconButton-1')"
        />
        <Tooltip location="top">
          {{ `${isSecondaryContact ? 'Remove' : 'Add'} secondary contact information` }}
        </Tooltip>
      </IconButton>
    </div>
    <div
      v-if="isSecondaryContact"
      class="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 content-start gap-4 mt-4 gap-4 [&>div]:h-fit"
    >
      <Textfield
        v-model="details.secondaryContactName"
        label="Secondary contact name *"
        :rules="[rules.required]"
      />
      <Textfield
        v-model="details.secondaryContact"
        v-maska:[options]
        label="Secondary contact number *"
        :rules="[rules.cell]"
      />
      <Textfield
        v-model="details.secondaryContactEmail"
        label="Secondary contact email *"
        :rules="[rules.email]"
      />
    </div>
    <Typography type="text-body-xs-semibold mt-6 mb-2"> Operation hours</Typography>
    <div class="flex gap-6 flex-col sm:flex-row">
      <template
        v-for="(item, n) in checkboxes"
        :key="n"
      >
        <div class="w-fit">
          <Checkbox
            v-model="checkboxes[n].status"
            :label="item.day.slice(0, 3)"
            @update:modelValue="e => resetTime(e, item)"
          />
        </div>
      </template>
    </div>
    <template v-for="(d, n) in checkboxes">
      <VRow
        v-if="d.status"
        :key="n"
        no-gutters
        align="center"
        class="mt-6"
      >
        <VCol
          cols="12"
          sm="2"
          class="mb-5 sm:!mb-0"
        >
          <Typography>{{ d.day }}</Typography>
        </VCol>
        <div class="flex flex-wrap gap-4">
          <Timepicker
            :time-value="d.from"
            label="Time from*"
            class="w-44"
            format="h:mm A"
            :minute-interval="15"
            :hour-range="notAfterToTime?.hour"
            :minute-range="notAfterToTime?.minute"
            hide-disabled-items
            @change="e => onChangeFrom(e, d.day)"
            @open="openTimePickerFrom(d)"
          />
          <Timepicker
            :time-value="d.to"
            label="Time to*"
            class="w-44"
            format="h:mm A"
            :minute-interval="15"
            :hour-range="notBeforeFromTime?.hour"
            :minute-range="notBeforeFromTime?.minute"
            hide-disabled-items
            @change="e => onChangeTo(e, d.day)"
            @open="openTimePickerTo(d)"
          />
        </div>
      </VRow>
    </template>
    <VRow
      no-gutters
      align="center"
      class="mt-1"
    >
      <VCol
        cols="12"
        sm="2"
        class="mb-5 sm:!mb-0"
      />
      <Typography
        v-if="rules.schedule() !== true"
        type="text-body-xs-regular"
        :color="getColor('functionalError')"
      >
        {{ rules.schedule() }}
      </Typography>
    </VRow>
    <Typography type="text-body-xs-semibold mt-6 mb-4"> Pickup instructions</Typography>
    <Textarea
      v-model="details.pickupInstructions"
      label="Instructions for the pickup *"
      rows="3"
      maxlength="255"
      :rules="[rules.required]"
    />
    <div
      v-if="editedLocation"
      class="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6"
    >
      <Select
        v-model="details.averageLoadTime"
        :items="loadTimes"
        label="Average load time *"
        class="h-fit"
        :rules="[v => !!v || 'Item is required']"
        required
      />
      <Switch
        v-model="details.overweight"
        label="Overweight facility"
        class="h-fit -mt-1"
        @update:modelValue="value => (details.averageWeight = value ? defaultOverWeight : null)"
      />
      <Textfield
        v-if="details.overweight"
        v-model.number="details.averageWeight"
        label="Average Weight(lbs) *"
        type="number"
        class="h-fit"
        :rules="[rules.required, rules.averageWeight]"
      />
    </div>
    <Button
      type="submit"
      class="mt-8 float-right"
      :disabled="isDisabled"
    >
      Set details
    </Button>
  </VForm>
</template>
