<script setup>
import { getColor } from '~/helpers/colors'
import { useWorkDetailsStore } from '~/stores/workDetails.store'

const props = defineProps({
  defaultDetails: Object,
  editedLocation: Object,
})
const emit = defineEmits(['close', 'setDetails', 'setCustomDetails'])
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
}
const rawVendorDetails = ref(toRaw(props.defaultDetails))

const details = ref(props.editedLocation? (props.editedLocation?.details?.customizedDetails? props.editedLocation?.details: rawVendorDetails.value) : (rawVendorDetails.value || emptyDetails))
const isSecondaryContact = ref(false)
const defaultTime = [
  {
    day: 'Monday',
    from: null,
    status: false,
    to: null,
  },
  {
    day: 'Tuesday',
    from: null,
    status: false,
    to: null,
  },
  { day: 'Wednesday', from: null, status: false, to: null },
  {
    day: 'Thursday',
    from: null,
    status: false,
    to: null,
  },
  {
    day: 'Friday',
    from: null,
    status: false,
    to: null,
  },
  {
    day: 'Saturday',
    from: null,
    status: false,
    to: null,
  },
  {
    day: 'Sunday',
    from: null,
    status: false,
    to: null,
  },
]
const checkboxes = ref(
  props.editedLocation?.details?.customizedDetails? (props.editedLocation.details.hoursOfOperation || defaultTime): (props.defaultDetails?.hoursOfOperation || defaultTime),
)

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
const setDetails = async () => {
  if (props.editedLocation) {
    saveYardDetails({...props.editedLocation, details: {...details.value}})
  } else {
    details.value.hoursOfOperation = checkboxes.value
    await saveVendorDetails()
  }
  emit('close')
}
</script>

<template>
  <VRow
    no-gutters
    justify="space-between"
    align="center"
    class="mb-8"
  >
    <Typography type="text-h2 md:text-h1"> Default location details </Typography>
    <IconButton
      icon="mdi-close"
      @click="emit('close')"
    />
  </VRow>
  <Typography
    :color="getColor('textSecondary')"
    class="mt-3 mb-8"
  >
    Create location details that will be shown by default. You can customize the details for an
    individual location at any time.
  </Typography>
  <div class="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 content-start gap-4">
    <Textfield
      v-model="details.primaryContactName"
      label="Primary contact name *"
    />
    <Textfield
      v-model="details.primaryContact"
      label="Primary contact number *"
    />
    <Textfield
      v-model="details.primaryContactEmail"
      label="Primary contact email *"
      placeholder="Primary@mail.com"
    />
    <template v-if="!isSecondaryContact">
      <IconButton
        width="48"
        height="48"
        variant="outlined"
        :color="getColor('uiLine')"
      >
        <Icon
          icon="mdi-plus"
          size="24"
          :color="getColor('iconButton-1')"
          @click="isSecondaryContact = true"
        />
        <Tooltip location="top"> Add secondary contact information </Tooltip>
      </IconButton>
    </template>
  </div>
  <div
    v-if="isSecondaryContact"
    class="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 content-start gap-4 mt-4 gap-4"
  >
    <Textfield
      v-model="details.secondaryContactName"
      label="Secondary contact name"
    />
    <Textfield
      v-model="details.secondaryContact"
      label="Secondary contact number"
    />
    <Textfield
      v-model="details.secondaryContactEmail"
      label="Secondary contact email"
    />
  </div>
  <Typography type="text-body-xs-semibold mt-6 mb-2"> Operation hours </Typography>
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
          @change="e => onChangeFrom(e, d.day)"
        />
        <Timepicker
          :time-value="d.to"
          label="Time to*"
          class="w-44"
          @change="e => onChangeTo(e, d.day)"
        />
      </div>
    </VRow>
  </template>

  <Typography type="text-body-xs-semibold mt-6 mb-4"> Pickup instructions </Typography>
  <Textarea
    v-model="details.pickupInstructions"
    label="Instructions for the pickup *"
    rows="3"
    maxlength="150"
  />
  <Button
    class="mt-8 float-right"
    @click="setDetails"
  >
    Set details
  </Button>
</template>
