<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth.store'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { useBookingRulesStore } from '~/stores/bookingRules.store'
import { cloneDeep, isEqual } from 'lodash'
import { checkPositiveInteger } from "~/helpers/validations-functions"

const { userData } = useAuthStore()
const workDetailsStore = useWorkDetailsStore()
const bookingRulesStore = useBookingRulesStore()
const { orgData } = storeToRefs(useAuthStore())
const { rules } = storeToRefs(bookingRulesStore)
const { yards } = storeToRefs(workDetailsStore)
const form = ref(null)
const errorRules = {
  days: value => checkPositiveInteger(value),
}

const validateRules = computed(() => {
  if (form.value?.errors.length) return true

  return isEqual(rules.value, orgData.value.bookingRules)
})
const onSave = async () => {
  await bookingRulesStore.updateRules(rules.value, userData.orgId)
}
const cancelChanges = () => {
  rules.value = cloneDeep(orgData.value.bookingRules)
}
onMounted(() => {
  cancelChanges()
})
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Booking rules
  </Typography>
  <VForm
    ref="form"
    @submit.prevent
  >
    <div class="w-full md:w-11/12 lg:w-8/12 grid sm:grid-cols-2 grid-cols-1 gap-6 [&>div]:h-fit">
      <Select
        v-model="rules.yard"
        :items="
          yards.map(yard => ({
            address: yard.value,
            geohash: yard.geohash,
            label: yard.label,
            lat: yard.lat,
            lng: yard.lng,
          }))
        "
        label="Set yard by default"
        item-title="label"
        item-value="address"
        return-object
      />
      <Textfield
        v-model.number="rules.timeForTruckersFromMarketplace"
        type="number"
        label="Set the time between the preferred carrier window and time before cutoff by default"
        required
        suffix="days"
        class="bookingRules"
        :rules="[errorRules.days(rules.timeForTruckersFromMarketplace)]"
      />
      <AutocompleteScac
        :scac-list="rules.truckers"
        :menu-btn="false"
        class="order-4 sm:!order-3 !-mb-4"
      />
      <Textfield
        v-model.number="rules.timeForNotificationBeforeCutoff"
        type="number"
        label="Set the time for notification before cutoff date by default"
        required
        suffix="days"
        class="bookingRules order-3 sm:!order-4"
        :rules="[errorRules.days(rules.timeForNotificationBeforeCutoff)]"
      />
    </div>
    <SaveCancelChanges
      class="mt-10"
      :disabled="validateRules"
      @onSave="onSave"
      @onCancel="cancelChanges"
    />
  </VForm>
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
