<script setup>
import { useDisplay } from 'vuetify'
import { storeToRefs } from "pinia"
import { useAuthStore } from '~/stores/auth.store'

const attrs = useAttrs()
const authStore = useAuthStore()
const { yardList } = storeToRefs(authStore)
const { xs } = useDisplay()
const newLocation = ref({
  address: null,
  label: '',
})
const commodity = ref(null)
const removeLocationDialog = ref(null)
const removedLocation = ref(null)
const selectItems = [
  { id: 10, label: 'Menu item #1' },
  { id: 1, label: 'Menu item #2' },
  { id: 2, label: 'Menu item #3' },
  { id: 3, label: 'Menu item #4' },
  { id: 4, label: 'Menu item #5' },
]

const addLocation = () => {
  authStore.addYard({
    id: new Date().valueOf(),
    value: newLocation.value.address.label,
    label: newLocation.value.label,
    text: `Commodity: ${commodity.value}`,
  }).then(() => {
    newLocation.value.address = null
    newLocation.value.label = ''
    commodity.value = null
  })
}
const openRemoveLocationDialog = locationId => {
  removeLocationDialog.value.show(true)
  removedLocation.value = yardList.value.find(l => l.id === locationId)
}
const removeLocation = () => {
  yardList.value = useArrayFilter(
    yardList.value,
    l => l.id !== removedLocation.value.id,
  ).value
  removeLocationDialog.value.show(false)
}
</script>

<template>
  <VRow
    no-gutters
    class="w-full md:w-11/12 [&>div]:mb-4 [&>div]:text-left"
    v-bind="{ ...attrs }"
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
  <div
    class="w-full md:w-11/12 mx-auto"
  >
    <LocationItems
      :locations="yardList"
      is-close-btn
      :class="{ 'mb-2': yardList.length }"
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
          <b>{{ removedLocation.label }} ({{ removedLocation.value }})</b>
          from your locations?
        </Typography>
      </RemoveCancelDialog>
    </template>
  </Dialog>
</template>
