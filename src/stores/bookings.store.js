import { defineStore } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'
import { uid } from 'uid'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '~/firebase'
import { useAuthStore } from '~/stores/auth.store'
import { getLocalServerTime, getLocalTime } from '@qualle-admin/qutil/dist/date'
import { capitalize } from 'lodash'
import moment from 'moment-timezone'
import { statuses } from '~/constants/statuses'
import { usePreferredTruckersStore } from '~/stores/preferredTruckers.store'

export const useBookingsStore = defineStore('bookings', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const { preferredTruckers } = usePreferredTruckersStore()
  let bookings = ref([])
  const drafts = ref([])
  const loading = ref(false)

  const getBookings = async ({ draft = false }) => {
    loading.value = true
    const { orgId } = authStore.userData
    if (draft) {
      const draftsQuery = query(collection(db, 'drafts'), where('orgId', '==', orgId))
      const querySnapshot = await getDocs(draftsQuery)
      drafts.value = querySnapshot.docs.map(doc => doc.data())
    } else {
      const bookingsQuery = query(collection(db, 'bookings'), where('orgId', '==', orgId))
      if (bookings.value.length) {
        loading.value = false

        return
      }
      const querySnapshot = await getDocs(bookingsQuery)
      const dataPromises = querySnapshot.docs.map(async doc => {
        // const commitments = await getCommitments(doc.data().id)
        return { ...doc.data(), entities: [] }
      })
      const data = await Promise.all(dataPromises)
      await validateBookingsExpiry(data)
      bookings.value = data
    }
    loading.value = false
  }
  const getCommitmentsByBookingId = async bookingId => {
    const q = await query(collection(db, 'commitments'), where('bookingId', '==', bookingId))
    const docData = await getDocs(q)
    const commitments = docData.docs.map(doc => doc.data())
    updateBookingCommitments(bookingId, commitments)
    return commitments
  }
  const updateBookingCommitments = async (bookingId, commitments) => {
    bookings.value.forEach(b => {
      if (b.id == bookingId) {
        b['entities'] = commitments
        b.expand = true
      } else {
        b.expand = false
      }
    })
  }
  const validateBookingsExpiry = async bookings => {
    const today = getLocalServerTime(moment(), 'America/Los_Angeles')
    for (const b of bookings) {
      if (moment(b.bookingExpiry).isBefore(moment(today)) || b.status === 'completed') {
        await moveToHistory(b)
      }
    }
  }
  const moveToHistory = async booking => {
    try {
      await deleteDoc(doc(db, 'bookings', booking.id))
      await setDoc(doc(collection(db, 'booking_history'), booking.id), {
        ...booking,
        status: booking?.status === 'completed' ? booking?.status : statuses.expired,
        updatedAt: getLocalTime().format(),
      })
    } catch ({ message }) {
      alertStore.warning({ content: 'Did not move to history' + message })
    }
  }
  const getBooking = async ({ id, draft = false }) => {
    loading.value = true
    try {
      if (draft) {
        const docData = await getDoc(doc(db, 'drafts', id))
        loading.value = false

        return docData.data()
      } else {
        const docData = await getDoc(doc(db, 'bookings', id))
        loading.value = false

        return docData.data()
      }
    } catch (e) {
      alertStore.info({ content: 'Booking not found' })
    }
  }
  const createBookingObj = booking => {
    const { userId, fullName, orgId, type } = authStore.userData
    const bookingId = uid(28)

    return {
      ...booking,
      id: bookingId,
      orgId,
      owner: userId,
      committed: 0,
      createdAt: getLocalTime().format(),
      updatedAt: getLocalTime().format(),
      carriers: [],
      preferredTruckers: preferredTruckers,
      status: statuses.active,
      createdBy: {
        userId,
        fullName,
        type,
        ...(authStore.userData?.workerId ? { workerId: authStore.userData.workerId } : {}),
      },
    }
  }
  const createBooking = async booking => {
    const newBooking = createBookingObj(booking)
    try {
      await setDoc(doc(collection(db, 'bookings'), newBooking.id), newBooking)

      bookings.value.push(newBooking)
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
  const updateBookingStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'bookings', id), {
        status,
      })

      // bookings.value.find(i => i.id === id).status = status
      alertStore.info({ content: `Booking ${status}!` })
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
          alertStore.info({ content: 'Bookings removed!' })
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
      alertStore.info({
        content: `${capitalize(collectionName).charAt(0) + collectionName.slice(1)} updated`,
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const updateBookingStore = async bookingId => {
    try {
      setTimeout(async () => {
        const updatedBooking = await getBooking({ id: bookingId, draft: false })
        bookings.value.forEach(booking => {
          if (booking.id === bookingId) {
            booking.committed = toRaw(updatedBooking.committed)
          }
        })
      }, 2000)
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const reset = () => {
    bookings.value = []
    drafts.value = []
    loading.value = false
  }

  return {
    bookings,
    drafts,
    loading,
    getBookings,
    getCommitmentsByBookingId,
    getBooking,
    createBooking,
    deleteBooking,
    createDraft,
    publishDraft,
    removeFromNetwork,
    updateBooking,
    updateBookingStatus,
    updateBookingStore,
    reset,
  }
})
