<script setup>
import {useBookingRulesStore} from "~/stores/bookingRules.store"
import {storeToRefs} from "pinia"

const bookingRulesStore = useBookingRulesStore()

const { rules } = storeToRefs(bookingRulesStore)

const onSave = () => {
  bookingRulesStore.updateRules(rules.value)
}
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Booking rules
  </Typography>
  <div class="grid sm:grid-cols-2 grid-cols-1 gap-6 [&>div]:h-fit">
    <Select
      v-model="rules.label"
      :items="bookingRulesStore.yardList"
      label="Set yard by default"
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
