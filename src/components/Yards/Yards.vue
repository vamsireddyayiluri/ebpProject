<script setup>
import { useDisplay } from 'vuetify'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from 'pinia'
import { uid } from 'uid'
import geohash from 'ngeohash'
import { getColor } from '~/helpers/colors'
import { cloneDeep } from 'lodash'

const attrs = useAttrs()
const workDetailsStore = useWorkDetailsStore()
const authStore = useAuthStore()
const { yards, vendorDetails } = storeToRefs(workDetailsStore)
const { xs, width } = useDisplay()
const newLocation = ref({
  address: null,
  label: '',
})
const commodity = ref(null)
const removeLocationDialog = ref(null)
const defaultDetails = ref(vendorDetails.value)
const locationDetailsDialog = ref(null)

const onSelectLocation = location => {
  newLocation.value.address = location.fullAddress
  newLocation.value.lat = location.lat
  newLocation.value.lng = location.lng
}
const addYard = async () => {
  const geohashedLocation = geohash.encode(newLocation.value.lat, newLocation.value.lng)
  await workDetailsStore.addYard({
    id: uid(28),
    value: newLocation.value.address,
    label: newLocation.value.label,
    lat: newLocation.value.lat,
    lng: newLocation.value.lng,
    geohash: geohashedLocation,
    commodity: commodity.value,
    text: `Commodity: ${commodity.value}`,
    details: {
      primaryContact: null,
      primaryContactName: null,
      primaryContactEmail: null,
      secondaryContact: null,
      secondaryContactName: null,
      secondaryContactEmail: null,
      pickupInstructions: null,
      hoursOfOperation: null,
    },
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
const editDetails = id => {
  locationDetailsDialog.value.show(true)
  const editedLocation = yards.value.find(i => i.id === id)
  locationDetailsDialog.value.data = editedLocation
}

const resetDefaultSettings = () => {
  defaultDetails.value = authStore.orgData.vendorDetails
}

// that function runs when click outside the addEditDialog
const onClickOutsideDialog = () => {
  locationDetailsDialog.value.data = null
  resetDefaultSettings()
}
</script>

<template>
  <div
    class="w-full"
    v-bind="{ ...attrs }"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 [&>div]:text-left">
      <Location
        v-model="newLocation.address"
        label="Address"
        hint="For e.g. 2972 Westheimer Santa Ana, Illinois"
        persistent-hint
        :autofocus="false"
        :prepend-icon="xs ? '' : 'mdi-map'"
        @onSelect="onSelectLocation"
      />
      <Textfield
        v-model.trim="newLocation.label"
        type="text"
        label="Location label"
        hint="For e.g. Farm label"
        persistent-hint
        class="h-fit"
      />
      <Textfield
        v-model.trim="commodity"
        type="text"
        label="Commodities that you export"
        hint="For e.g. electronics, food"
        persistent-hint
        :prepend-icon="xs ? '' : 'mdi-package-variant'"
      />
      <div class="flex gap-5 flex-nowrap sm:flex-wrap">
        <VCard
          variant="outlined"
          :color="getColor('uiLine')"
          class="w-full h-12 pl-4"
        >
          <div class="flex justify-between">
            <Typography
              :color="
                getColor(!defaultDetails?.primaryContactName ? 'textDisabled' : 'textPrimary')
              "
              class="mt-3.5"
            >
              {{
                width >= 600 && width <= 770
                  ? 'Details'
                  : !defaultDetails?.primaryContactName
                  ? 'Location details'
                  : 'Edit default details'
              }}
            </Typography>
            <Button
              v-if="!defaultDetails?.primaryContactName"
              prepend-icon="mdi-plus"
              variant="plain"
              class="-mt-0.5 pl-0"
              @click="locationDetailsDialog.show(true)"
            >
              Set
            </Button>
            <IconButton
              v-else
              icon="mdi-pencil"
              width="24"
              min-width="24"
              height="24"
              size="22"
              class="mt-2.5 mr-4"
              @click="locationDetailsDialog.show(true)"
            />
          </div>
        </VCard>
        <Button
          variant="outlined"
          type="button"
          :disabled="!newLocation?.address || !newLocation?.label"
          class="w-min"
          @click="addYard"
        >
          Add
        </Button>
      </div>
    </div>
    <LocationItems
      :locations="yards"
      is-close-btn
      :is-edit-btn="!!defaultDetails"
      class="mt-5 sm:!mt-2"
      :class="{ 'mb-2': yards?.length }"
      @onRemove="locationId => openRemoveLocationDialog(locationId)"
      @onEdit="editDetails"
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
  <Dialog
    ref="locationDetailsDialog"
    max-width="980"
    @update:modelValue="onClickOutsideDialog"
  >
    <template #text>
      <LocationDetailsDialog
        :default-details="cloneDeep(defaultDetails)"
        :edited-location="cloneDeep(locationDetailsDialog.data)"
        @close="
          locationDetailsDialog.show(false),
            (locationDetailsDialog.data = null),
            resetDefaultSettings()
        "
      />
    </template>
  </Dialog>
</template>
