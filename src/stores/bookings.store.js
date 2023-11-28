import { defineStore, storeToRefs } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'
import { uid } from 'uid'
import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAuthStore } from '~/stores/auth.store'
import { getLocalServerTime, getLocalTime } from '@qualle-admin/qutil/dist/date'
import { capitalize } from 'lodash'
import moment from "moment-timezone"

export const useBookingsStore = defineStore('bookings', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const { userData } = storeToRefs(authStore)
  const bookings = ref([])
  const drafts = ref([])
  const loading = ref(false)

  const getBookings = async ({ draft = false }) => {
    loading.value = true
    const userId = userData.value.userId
    if (draft) {
      const draftsQuery = query(collection(db, 'drafts'), where('owner', '==', userId))
      const querySnapshot = await getDocs(draftsQuery)
      drafts.value = querySnapshot.docs.map(doc => doc.data())
    } else {
      const bookingsQuery = query(collection(db, 'bookings'), where('owner', '==', userId))
      const querySnapshot = await getDocs(bookingsQuery)
      const data = querySnapshot.docs.map(doc => doc.data())
      validateBookingsExpiry(data)
      bookings.value = data
    }
    loading.value = false
  }
  const validateBookingsExpiry = async bookings => {
    const today = getLocalServerTime(moment(), 'America/Los_Angeles')
    for (const b of bookings) {
      if (moment(b.bookingExpiry).isBefore(moment(today))) {
        await moveToHistory(b)
      }
    }
  }
  const moveToHistory = async booking => {
    try {
      await deleteDoc(doc(db, 'bookings', booking.id))
      await setDoc(doc(collection(db, 'booking_history'), booking.id), {...booking, status: 'expired', updatedAt: getLocalTime().format() })
    }
    catch ({ message }) {
      alertStore.warning({ content: 'Did not move to history' + message })
    }
  }
  const createBookingObj = booking => {
    const userId = userData.value.userId
    const bookingId = uid(28)

    return {
      ...booking,
      id: bookingId,
      owner: userId,
      committed: 0,
      createdAt: getLocalTime().format(),
      updatedAt: getLocalTime().format(),
    }
  }
  const createBooking = async booking => {
    const newBooking = createBookingObj(booking)
    try {
      await setDoc(doc(collection(db, 'booking_history'), newBooking.id), newBooking)
      bookings.value.push(newBooking)
      alertStore.info({ content: 'Booking created' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const createDraft = async draft => {
    const newDraft = createBookingObj(draft)
    try {
      await setDoc(doc(collection(db, 'drafts'), newDraft.id), newDraft)
      drafts.value.push(newDraft)
      alertStore.info({ content: 'Draft created' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const deleteBooking = async (id, draft = false) => {
    try {
      if (draft) {
        const index = drafts.value.findIndex(i => i.id === id)
        if (index > -1) {
          drafts.value.splice(index, 1)
          await deleteDoc(doc(db, 'drafts', id))
          alertStore.info({ content: 'Draft was deleted' })
        } else alertStore.warning({ content: 'Draft not found' })

      } else {
        const index = bookings.value.findIndex(i => i.id === id)
        if (index > -1) {
          bookings.value.splice(index, 1)
          await deleteDoc(doc(db, 'bookings', id))
          alertStore.info({content: 'Bookings removed!'})
        } else alertStore.warning({ content: 'Booking not found' })
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const publishDraft = async booking => {
    try {
      await deleteBooking(booking.id, true)
      await setDoc(doc(collection(db, 'bookings'), booking.id), booking)
      bookings.value.push(booking)
      alertStore.info({ content: `Booking Ref#${booking.id} was published` })

      return 'published'
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const removeFromNetwork = async booking => {
    try {
      await deleteBooking(booking.id)
      await setDoc(doc(collection(db, 'drafts'), booking.id), booking)
      drafts.value.push(booking)
      alertStore.info({ content: `Booking Ref#${booking.id} moved to the draft` })

      return 'deleted'
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const updateBooking = async (booking, collectionName) => {
    try {
      await updateDoc(doc(db, collectionName, booking.id), { ...booking })
      alertStore.info({content: `${capitalize(collectionName).charAt(0) + collectionName.slice(1)} updated`})
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  return {
    bookings,
    drafts,
    loading,
    getBookings,
    createBooking,
    deleteBooking,
    createDraft,
    publishDraft,
    removeFromNetwork,
    updateBooking,
  }
})
