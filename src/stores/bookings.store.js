import { defineStore } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'
import { useBookingHistoryStore } from '~/stores/bookingHistory.store'

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
  const { setBooking } = useBookingHistoryStore()
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
      drafts.value = querySnapshot.docs
        .map(doc => doc.data())
        .sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)))
    } else {
      const bookingsQuery = query(collection(db, 'bookings'), where('orgId', '==', orgId))

      const querySnapshot = await getDocs(bookingsQuery)
      const dataPromises = querySnapshot.docs.map(async doc => {
        // const commitments = await getCommitments(doc.data().id)
        return { ...doc.data(), entities: [] }
      })
      const data = await Promise.all(dataPromises)
      bookings.value = data.sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)))

      await validateBookingsExpiry(data)
    }
    loading.value = false
  }
  const getCommitmentsByBookingId = async bookingId => {
    const q = await query(collection(db, 'commitments'), where('bookingId', '==', bookingId))
    const docData = await getDocs(q)
    const commitments = docData.docs
      .map(doc => doc.data())
      .sort((a, b) => moment(b.commitmentDate).diff(moment(a.commitmentDate)))
    await updateBookingCommitments(bookingId, commitments)

    return commitments
  }
  const updateBookingCommitments = async (bookingId, commitments) => {
    bookings.value.forEach(b => {
      if (b.id == bookingId) {
        b['entities'] = commitments
        b.expand = true
      }
    })
  }
  const validateBookingsExpiry = async bookings => {
    const today = getLocalServerTime(moment(), 'America/Los_Angeles')
    for (const b of bookings) {
      if (moment(b.loadingDate).isBefore(moment(today)) || b.status === 'completed') {
        await moveToHistory(b)
      }
    }
  }
  const moveToHistory = async booking => {
    try {
      await deleteDoc(doc(db, 'bookings', booking.id))
      let indexToDelete = bookings.value.findIndex(bookingobj => bookingobj.id === booking.id)
      bookings.value.splice(indexToDelete, 1)
      setBooking(booking)
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
    const { userId, name, orgId, type } = userData
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
        name,
        type,
        ...(authStore.userData?.workerId ? { workerId: authStore.userData.workerId } : {}),
      },
    }
  }
  const createBooking = async booking => {
    const newBooking = createBookingObj(booking)
    try {
      await setDoc(doc(collection(db, 'bookings'), newBooking.id), newBooking)

      bookings.value.unshift(newBooking)
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const createDraft = async draft => {
    const newDraft = createBookingObj(draft)
    try {
      await setDoc(doc(collection(db, 'drafts'), newDraft.id), newDraft)
      drafts.value.unshift(newDraft)
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

      bookings.value.find(i => i.id === id).status = status
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
      bookings.value.unshift(booking)
      alertStore.info({ content: `Booking Ref# ${booking.ref} was published` })

      return 'published'
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const removeFromNetwork = async booking => {
    try {
      const newDraft = createBookingObj(booking)
      await deleteBooking(booking.id)
      await setDoc(doc(collection(db, 'drafts'), newDraft.id), newDraft)
      drafts.value.unshift(booking)
      alertStore.info({ content: `Booking Ref# ${booking.ref} moved to the draft` })

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

  // Updating booking store data after performing action
  const updateBookingStore = async bookingId => {
    try {
      setTimeout(async () => {
        const updatedBooking = await getBooking({ id: bookingId, draft: false })
        bookings.value.forEach(booking => {
          if (booking.id === bookingId) {
            booking.committed = toRaw(updatedBooking.committed)
            booking.status = toRaw(updatedBooking.status)
          }
        })
        await getCommitmentsByBookingId(bookingId)
      }, 2000)
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const closeBookingExpansion = async bookingId => {
    const index = bookings.value.findIndex(val => val.id === bookingId)
    bookings.value[index].expand = false
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
    closeBookingExpansion,
  }
})
