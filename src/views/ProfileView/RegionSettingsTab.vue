<script setup>
const newLocation = ref({
  address: null,
  label: '',
})
const selectItems = [
  { id: 10, label: 'Menu item #1' },
  { id: 1, label: 'Menu item #2' },
  { id: 2, label: 'Menu item #3' },
  { id: 3, label: 'Menu item #4' },
  { id: 4, label: 'Menu item #5' },
]
const locations = ref([])
const locationDialog = ref(null)
const removedLocation = ref(null)
const addContainer = () => {
  locations.value.push({
    id: newLocation.value.address.id,
    value: newLocation.value.address.label,
    label: newLocation.value.label,
  })
  newLocation.value.address = null
  newLocation.value.label = ''
}
const openRemoveLocationDialog = locationId => {
  locationDialog.value.show(true)
  removedLocation.value = locations.value.find(l => l.id === locationId)
}
const removeLocation = locationId => {
  locations.value = useArrayFilter(locations.value, l => l.id !== locationId).value
  locationDialog.value.show(false)
}
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Region settings
  </Typography>
  <form
    :style="{ maxWidth: '600px' }"
    @submit.prevent="addContainer"
  >
    <VRow
      no-gutters
      class="mt-10 mb-4"
    >
      <VCol
        cols="12"
        sm="5"
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
          prepend-icon="mdi-map"
          class="text-left"
        />
      </VCol>
      <VCol
        cols="12"
        sm=""
      >
        <Textfield
          v-model="newLocation.label"
          type="text"
          label="Location label"
          hint="For e.g. Farm label"
          persistent-hint
          class="mx-0 mx-sm-4 mt-4 mt-sm-0 text-left"
        />
      </VCol>
      <Button
        variant="outlined"
        type="submit"
        :disabled="!newLocation.address || !newLocation.label"
        class="mt-4 mt-sm-0 mx-auto"
        @click.prevent="addContainer"
      >
        Add
      </Button>
    </VRow>
    <VRow no-gutters>
      <LocationItems
        :locations="locations"
        is-close-btn
        :style="{ width: '100%' }"
        @onRemove="openRemoveLocationDialog"
      />
    </VRow>
  </form>

  <Dialog
    ref="locationDialog"
    width="50%"
    min-width="400px"
  >
    <template #text>
      <RemoveLocationDialog
        :removed-location="removedLocation"
        @onRemove="removeLocation"
      />
    </template>
  </Dialog>
</template>

<style lang="scss" scoped></style>
