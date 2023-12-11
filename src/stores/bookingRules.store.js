import { defineStore } from 'pinia'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAlertStore } from '~/stores/alert.store'

export const useBookingRulesStore = defineStore('bookingRules', () => {
  const alertStore = useAlertStore()

  const loading = ref(false)

  const createBookingRulesObj = (bookingRules = {}) => {
    return {
      defaultYard: null,
      timeForTruckersFromMarketplace: 5,
      preferredTruckersList: { scacList: { list: [] } },
      timeForNotificationBeforeCutoff: 1,
      ...bookingRules,
    }
  }

  const rules = ref(createBookingRulesObj())

  const getRules = async orgId => {
    loading.value = true
    const docData = await getDoc(doc(db, 'organizations', orgId))
    const bookingRules = docData.data().bookingRules

    if (bookingRules) {
      rules.value = bookingRules
    }
    loading.value = false

    return rules
  }

  const updateRules = async (bookingRules, orgId) => {
    const newBookingRules = createBookingRulesObj(bookingRules)

    try {
      await updateDoc(doc(db, 'organizations', orgId), {
        bookingRules: newBookingRules,
      })
      rules.value = newBookingRules
      alertStore.info({ content: 'Booking rules updated' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  return {
    rules,
    getRules,
    updateRules,
    createBookingRulesObj,
  }
})
