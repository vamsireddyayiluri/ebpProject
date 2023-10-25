import { defineStore } from 'pinia'

export const useBookingRulesStore = defineStore('bookingRules', () => {
  const rules = ref({
    defaultYard: '',
    timeForTruckersFromMarketplace: 5,
    preferredTruckersList: { scacList: { list: [] } },
    timeForNotificationBeforeCutoff: 1,
  })
  const yardList = ref(['Good yard', 'Work yard', 'Farm yard'])

  const updateRules = value => {
    rules.value = value
  }

  return {
    rules,
    yardList,
    updateRules,
  }
})
