import { defineStore } from 'pinia'
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
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
