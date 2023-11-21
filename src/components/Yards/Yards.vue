<script setup>
import { useDisplay } from 'vuetify'

const props = defineProps({
  yards: Array,
})
const attrs = useAttrs()
const { yards } = toRefs(props)
const { xs } = useDisplay()
const newLocation = ref({
  address: null,
  label: '',
})
const commodity = ref(null)
const removeLocationDialog = ref(null)
const selectItems = [
  { id: 10, value: 'item1', label: 'Menu item #1' },
  { id: 1, value: 'item2', label: 'Menu item #2' },
  { id: 2, value: 'item3', label: 'Menu item #3' },
  { id: 3, value: 'item4', label: 'Menu item #4' },
  { id: 4, value: 'item5', label: 'Menu item #5' },
]

const addLocation = () => {
  yards.value.push({
    id: new Date().valueOf(),
    value: newLocation.value.address.value,
    label: newLocation.value.label,
    text: `Commodity: ${commodity.value}`,
  })
  newLocation.value.address = null
  newLocation.value.label = ''
  commodity.value = null
}
const openRemoveLocationDialog = locationId => {
  removeLocationDialog.value.show(true)
  removeLocationDialog.value.data = yards.value.find(l => l.id === locationId)
}
const removeLocation = async () => {
  const index = yards.value.findIndex(q => q.id === removeLocationDialog.value.data.id)
  yards.value.splice(index, 1)
  removeLocationDialog.value.show(false)
}
</script>

<template>
  <div
    class="w-full md:w-11/12"
    v-bind="{ ...attrs }">
    <VRow
      no-gutters
      class="[&>div]:mb-4 [&>div]:text-left"
    >
      <VCol
        cols="12"
        sm="6"
      >
        <Autocomplete
          v-model="newLocation.address"
          :items="selectItems"
          label="Address"
          hint="For e.g. 2972 Westheimer Santa Ana, Illinois"
          persistent-hint
          item-title="label"
          item-value="id"
          return-object
          :prepend-icon="xs ? '' : 'mdi-map'"
        />
      </VCol>
      <VCol
        cols="12"
        sm="6"
      >
        <Textfield
          v-model="newLocation.label"
          type="text"
          label="Location label"
          hint="For e.g. Farm label"
          persistent-hint
          class="mx-0 sm:!ml-4"
        />
      </VCol>
      <VCol
        cols="12"
        sm="6"
      >
        <Textfield
          v-model="commodity"
          type="text"
          label="Commodities that you export"
          hint="For e.g. electronics, food"
          persistent-hint
          :prepend-icon="xs ? '' : 'mdi-package-variant'"
        />
      </VCol>
      <Button
        variant="outlined"
        type="button"
        :disabled="!newLocation?.address || !newLocation?.label"
        class="w-full mx-0 sm:!ml-4 sm:!w-auto"
        @click="addLocation"
      >
        Add
      </Button>
    </VRow>
    <LocationItems
      :locations="yards"
      is-close-btn
      class="mt-5 sm:!mt-2"
      :class="{ 'mb-2': yards?.length }"
      @onRemove="locationId => openRemoveLocationDialog(locationId)"
    />
  </div>

  <Dialog
    ref="removeLocationDialog"
    max-width="480"
  >
    <template #text>
      <RemoveCancelDialog
        btn-name="Remove"
        @close="removeLocationDialog.show(false)"
        @onClickBtn="removeLocation"
      >
        <Typography>
          Are you sure you want to remove
          <b>{{ removeLocationDialog.data.label }} ({{ removeLocationDialog.data.value }})</b>
          from your locations?
        </Typography>
      </RemoveCancelDialog>
    </template>
  </Dialog>
</template>
