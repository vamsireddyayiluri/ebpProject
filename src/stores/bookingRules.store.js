import { defineStore } from 'pinia'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAlertStore } from '~/stores/alert.store'
import { useAuthStore } from '~/stores/auth.store'
import { deepCopy } from 'json-2-csv/lib/utils'

export const useBookingRulesStore = defineStore('bookingRules', () => {
  const {
    orgData: { bookingRules },
  } = useAuthStore()
  const alertStore = useAlertStore()
  const rules = ref(
    deepCopy({
      yard: bookingRules.yard,
      truckers: bookingRules?.truckers || { list: [] },
      timeForTruckersFromMarketplace: bookingRules.timeForTruckersFromMarketplace,
      timeForNotificationBeforeCutoff: bookingRules.timeForNotificationBeforeCutoff,
      isPreferredCarrierWindow: bookingRules.isPreferredCarrierWindow,
      preferredCarrierWindow: bookingRules.preferredCarrierWindow,
    }),
  )

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
