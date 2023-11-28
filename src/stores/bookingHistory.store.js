import { defineStore, storeToRefs } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore"
import { db } from "~/firebase"
import { useAuthStore } from "~/stores/auth.store"

export const useBookingHistoryStore = defineStore('bookingHistory', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const { userData } = storeToRefs(authStore)
  const bookings = ref([])
  const loading = ref(false)

  const getBookingHistory = async () => {
    loading.value = true
    const userId = userData.value.userId
    const bookingsQuery = query(collection(db, 'booking_history'), where('owner', '==', userId))
    const querySnapshot = await getDocs(bookingsQuery)
    bookings.value = querySnapshot.docs.map(doc => doc.data())
    loading.value = false
  }
  const deleteHistoryBooking = async id => {
    try {
      const index = bookings.value.findIndex(i => i.id === id)
      if (index > -1) {
        await deleteDoc(doc(db, 'booking_history', id))
        bookings.value.splice(index, 1)
        alertStore.info({ content: 'Bookings was deleted from history' })
      }
    } catch (e) {
      alertStore.info({ content: e })
    }
  }

  return {
    bookings,
    loading,
    getBookingHistory,
    deleteHistoryBooking,
  }
})
