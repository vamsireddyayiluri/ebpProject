import { defineStore } from 'pinia'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAlertStore } from '~/stores/alert.store'
import { useAuthStore } from '~/stores/auth.store'

export const useBookingRulesStore = defineStore('bookingRules', () => {
  const {
    orgData: { bookingRules },
  } = useAuthStore()
  const alertStore = useAlertStore()
  const rules = ref({
    yard: bookingRules.yard || null,
    truckers: bookingRules.truckers || { list: [] },
    timeForTruckersFromMarketplace: bookingRules.timeForTruckersFromMarketplace || null,
    timeForNotificationBeforeCutoff: bookingRules.timeForNotificationBeforeCutoff || null,
  })

  const updateRules = async (bookingRules, orgId) => {
    try {
      await updateDoc(doc(db, 'organizations', orgId), {
        bookingRules: bookingRules,
      })
      rules.value = bookingRules
      alertStore.info({ content: 'Booking rules updated' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  return {
    rules,
    updateRules,
  }
})
