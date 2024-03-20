<script setup>
import { getColor } from '~/helpers/colors'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { emailRegex } from '@qualle-admin/qutil/dist/patterns'
import { defaultOverWeight, maximumOverWeight } from '~/constants/settings'
import { isEqual } from 'lodash'
import { useAuthStore } from '~/stores/auth.store'

const props = defineProps({
  defaultDetails: Object,
  editedLocation: Object,
})
const emit = defineEmits(['close', 'setDetails', 'setCustomDetails'])
const authStore = useAuthStore()
const { saveVendorDetails, saveYardDetails } = useWorkDetailsStore()
const emptyDetails = {
  primaryContact: null,
  primaryContactName: null,
  primaryContactEmail: null,
  secondaryContact: null,
  secondaryContactName: null,
  secondaryContactEmail: null,
  pickupInstructions: null,
  hoursOfOperation: null,
  ...(props.editedLocation
    ? {
      averageLoadTime: null,
      overweight: null,
      averageWeight: null,
    }
    : {}),
}
const rawVendorDetails = ref(toRaw(props.defaultDetails))
const details = ref(
  props.editedLocation
    ? props.editedLocation?.details?.customizedDetails
      ? props.editedLocation?.details
      : rawVendorDetails.value
    : rawVendorDetails.value || emptyDetails,
)
const isSecondaryContact = ref(false)
const createDefaultTimeArray = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const defaultTimeFrom = {
    hh: '09',
    mm: '30',
    A: 'AM',
  }
  const defaultTimeTo = {
    hh: '05',
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
const checkboxes = ref(
  props.editedLocation?.details?.customizedDetails
    ? props.editedLocation.details.hoursOfOperation || defaultTime
    : props.defaultDetails?.hoursOfOperation || defaultTime,
)
const form = ref(null)
const loadTimes = ['0.5 hours', '1 hour', '1.5 hours']
const onChangeFrom = (e, day) => {
  checkboxes.value.map(d => {
    if (d.day === day) {
      d.from = e.displayTime
    }
  })
}

const onChangeTo = (e, day) => {
  checkboxes.value.map(d => {
    if (d.day === day) {
      d.to = e.displayTime
    }
  })
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
    return value ? true : 'Required field'
  },
  averageWeight(value) {
    return value < defaultOverWeight || value > maximumOverWeight
      ? `Weight must be b/w${defaultOverWeight} to ${maximumOverWeight}`
      : true
  },
}
const currentEditedDetails = props.editedLocation
  ? authStore.orgData.locations.find(l => l.id === props.editedLocation.id)?.details
  : authStore.orgData?.vendorDetails || {}
const isDirty = ref(null)
const isDisabled = computed(
  () => !!form.value?.errors.length || form.value?.isValidating || !isDirty.value,
)

const checkFormModified = () => {
  isDirty.value = !isEqual(details.value, currentEditedDetails)
}
const setDetails = async () => {
  const validationData = await form.value.validate()
  if (validationData.valid) {
    if (props.editedLocation) {
      saveYardDetails({ ...props.editedLocation, details: { ...details.value } })
    } else {
      details.value.hoursOfOperation = checkboxes.value
      await saveVendorDetails(details.value)
    }
    emit('close')
  }
}
watch(details, checkFormModified, { deep: true })
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
      >
        <Icon
          :icon="isSecondaryContact ? 'mdi-minus' : 'mdi-plus'"
          size="24"
          :color="getColor('iconButton-1')"
          @click="isSecondaryContact = !isSecondaryContact"
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
        label="Secondary contact number *"
        :rules="[rules.cell]"
      />
      <Textfield
        v-model="details.secondaryContactEmail"
        label="Secondary contact email *"
        :rules="[rules.email]"
      />
    </div>
    <Typography type="text-body-xs-semibold mt-6 mb-2">
      Operation hours
    </Typography>
    <div class="flex gap-6 flex-col sm:flex-row">
      <template
        v-for="(item, n) in checkboxes"
        :key="n"
      >
        <div class="w-fit">
          <Checkbox
            v-model="checkboxes[n].status"
            :label="item.day.slice(0, 3)"
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
            :minute-interval="15"
            @change="e => onChangeFrom(e, d.day)"
          />
          <Timepicker
            :time-value="d.to"
            label="Time to*"
            class="w-44"
            :minute-interval="15"
            @change="e => onChangeTo(e, d.day)"
          />
        </div>
      </VRow>
    </template>

    <Typography type="text-body-xs-semibold mt-6 mb-4">
      Pickup instructions
    </Typography>
    <Textarea
      v-model="details.pickupInstructions"
      label="Instructions for the pickup *"
      rows="3"
      maxlength="150"
      :rules="[rules.required]"
    />
    <div
      v-if="editedLocation"
      class="grid grid-cols-2 md:grid-cols-3 items-center gap-6 mt-6"
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
        class="h-fit"
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
