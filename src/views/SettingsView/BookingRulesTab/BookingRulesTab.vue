<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth.store'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { useBookingRulesStore } from '~/stores/bookingRules.store'

const { userData } = useAuthStore()
const workDetailsStore = useWorkDetailsStore()
const bookingRulesStore = useBookingRulesStore()

const { rules } = storeToRefs(bookingRulesStore)
const { yards } = storeToRefs(workDetailsStore)

const onSave = () => {
  bookingRulesStore.updateRules(rules.value, userData.orgId)
}

onMounted(async () => {
  await bookingRulesStore.getRules(userData.orgId)
})
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Booking rules
  </Typography>
  <div class="w-full md:w-11/12 lg:w-8/12 grid sm:grid-cols-2 grid-cols-1 gap-6 [&>div]:h-fit">
    <Select
      v-model="rules.defaultYard"
      :items="yards.map(yard => ({
        address: yard.value,
        geohash: yard.geohash,
        label: yard.label,
        lat: yard.lat,
        lng: yard.lng,
      }))"
      label="Set yard by default"
      item-title="label"
      item-value="address"
      return-object
    />
    <Textfield
      v-model="rules.timeForTruckersFromMarketplace"
      type="number"
      label="Set the time between the preferred carrier window and time before cutoff by default"
      required
      suffix="days"
      class="bookingRules"
    />
    <AutocompleteScac
      :scac-list="rules.preferredTruckersList"
      :menu-btn="false"
      class="order-4 sm:!order-3 !-mb-4"
      @onChange="scacList => rules.preferredTruckersList.scacList.list = scacList"
    />
    <Textfield
      v-model="rules.timeForNotificationBeforeCutoff"
      type="number"
      label="Set the time for notification before cutoff date by default"
      required
      suffix="days"
      class="bookingRules order-3 sm:!order-4"
    />
  </div>
  <SaveCancelChanges
    class="mt-10"
    @onSave="onSave"
  />
</template>

<style lang="scss">
.bookingRules {
  .v-field__outline__notch {
    min-width: auto;
    max-width: fit-content;
    width: calc(100% - 24px);
    .v-label {
      white-space: unset;
      &.v-label.v-field-label--floating {
        transform: translateY(-60%);
      }
    }
  }
}
</style>
