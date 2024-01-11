<script setup>
import { useDisplay } from 'vuetify'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from 'pinia'
import { uid } from 'uid'
import geohash from 'ngeohash';


const attrs = useAttrs()
const workDetailsStore = useWorkDetailsStore()
const authStore = useAuthStore()
const { yards } = storeToRefs(workDetailsStore)
const { xs } = useDisplay()
const newLocation = ref({
  address: null,
  label: '',
})
const commodity = ref(null)
const removeLocationDialog = ref(null)

const onSelectLocation = location => {
  newLocation.value.address = location.fullAddress
  newLocation.value.lat = location.lat
  newLocation.value.lng = location.lng
}
const addYard = async () => {
  const geohashedLocation = geohash.encode(newLocation.value.lat, newLocation.value.lng);
  await workDetailsStore.addYard({
    id: uid(28),
    value: newLocation.value.address,
    label: newLocation.value.label,
    lat: newLocation.value.lat,
    lng: newLocation.value.lng,
    geohash: geohashedLocation,
    commodity: commodity.value,
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
const removeYard = async () => {
  await workDetailsStore.removeYard(removeLocationDialog.value.data.id)
  removeLocationDialog.value.show(false)
}
</script>

<template>
  <div
    class="w-full md:w-11/12"
    v-bind="{ ...attrs }"
  >
    <VRow
      no-gutters
      class="[&>div]:mb-4 [&>div]:text-left"
    >
      <VCol
        cols="12"
        sm="6"
      >
        <Location
          v-model="newLocation.address"
          label="Address"
          hint="For e.g. 2972 Westheimer Santa Ana, Illinois"
          persistent-hint
          :autofocus="false"
          :prepend-icon="xs ? '' : 'mdi-map'"
          @onSelect="onSelectLocation"
        />
      </VCol>
      <VCol
        cols="12"
        sm="6"
      >
        <Textfield
          v-model.trim="newLocation.label"
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
          v-model.trim="commodity"
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
        @click="addYard"
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
        @onClickBtn="removeYard"
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
