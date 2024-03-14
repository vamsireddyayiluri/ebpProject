import { defineStore } from 'pinia'
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAlertStore } from '~/stores/alert.store'
import { useAuthStore } from '~/stores/auth.store'

export const useBookingRulesStore = defineStore('bookingRules', () => {
  const {
    orgData: { bookingRules, locations },
  } = useAuthStore()
  const alertStore = useAlertStore()
  const rules = ref({
    yard: locations || null,
    truckers: bookingRules?.truckers || { list: [] },
    timeForTruckersFromMarketplace: bookingRules.timeForTruckersFromMarketplace || '',
    timeForNotificationBeforeCutoff: bookingRules.timeForNotificationBeforeCutoff || '',
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
  const getTruckers = async () => {
    const truckersQuery = query(collection(db, 'organizations'), where('org_type', '==', 'asset'))
    const querySnapshot = await getDocs(truckersQuery)

    return querySnapshot.docs.map(doc => {
      const { orgId, scac, email, company } = doc.data()

      return {
        id: orgId,
        scac,
        email,
        company,
      }
    })
  }

  return {
    rules,
    updateRules,
    getTruckers,
  }
})
