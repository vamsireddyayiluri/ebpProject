import { defineStore, storeToRefs } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore"
import { db } from "~/firebase"
import { useAuthStore } from "~/stores/auth.store"
import { getLocalTime } from "@qualle-admin/qutil/dist/date"

export const useBookingHistoryStore = defineStore('bookingHistory', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const { userData } = storeToRefs(authStore)
  const bookings = ref([])
  const loading = ref(false)

  const getBookingHistory = async () => {
    loading.value = true
    const { orgId } = userData.value
    const bookingsQuery = query(collection(db, 'booking_history'), where('orgId', '==', orgId))
    const querySnapshot = await getDocs(bookingsQuery)
    bookings.value = querySnapshot.docs.map(doc => doc.data())
    loading.value = false
  }
  const getBooking = async id => {
    loading.value = true
    try {
      const docData = await getDoc(doc(db, 'booking_history', id))
      loading.value = false

      return docData.data()
    }
    catch (e) {
      alertStore.info({ content: 'Booking not found' })
    }
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
  const reactivateBooking = async booking => {
    try {
      await deleteDoc(doc(db, 'booking_history', booking.id))
      await setDoc(doc(collection(db, 'bookings'), booking.id),
        {
          ...booking,
          committed: 0,
          updatedAt: getLocalTime().format(),
          carriers: [],
          status: '',
        })
      alertStore.info({ content: 'Reactivated booking' })}
    catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const duplicateBooking = async booking => {
    try {
      await setDoc(doc(collection(db, 'bookings'), booking.id),
        {
          ...booking,
          committed: 0,
          updatedAt: getLocalTime().format(),
          carriers: [],
          status: '',
        })
      alertStore.info({ content: 'Duplicated booking' })}
    catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  return {
    bookings,
    loading,
    getBookingHistory,
    getBooking,
    deleteHistoryBooking,
    reactivateBooking,
    duplicateBooking,
  }
})
