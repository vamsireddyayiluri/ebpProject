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
  let pastBookings = ref([])
  const drafts = ref([])
  const loading = ref(false)
  const getallBookings = async () => {
    const { orgId } = authStore.userData

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
  const getBookings = async ({ draft = false }) => {
    loading.value = true
    const { orgId } = authStore.userData
    if (draft) {
      const draftsQuery = query(collection(db, 'drafts'), where('orgId', '==', orgId))
      const querySnapshot = await getDocs(draftsQuery)
      drafts.value = querySnapshot.docs.map(doc => doc.data())
    } else {
      await getallBookings()
      bookings.value = bookings.value.filter(
        booking => booking.status !== statuses.completed && booking.status !== statuses.expired && booking.status !== statuses.canceled,
      )
    }
    loading.value = false
  }
  const getBookingHistory = async () => {
    loading.value = true
    await getallBookings()
    pastBookings.value = bookings.value.filter(
      booking => booking.status === statuses.completed || booking.status === statuses.expired || booking.status === statuses.canceled,
    )
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
        const updatedBookingData = {
          ...b,
          status: b.status === 'completed' ? b.status : statuses.expired,
          updatedAt: getLocalTime().format(),
        }
        // updatePromises.push(updateBooking(updatedBookingData, 'bookings', true))
      }
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
    const { userId, name, orgId, type } = authStore.userData
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
  const updateBookingStatus = async (id, status, reason) => {
    try {
      await updateDoc(doc(db, 'bookings', id), {
        status,
        ...(reason ? { reason: reason?.trim() } : {}),
      })

      bookings.value.find(i => i.id === id).status = status
      if (status === statuses.canceled) {
        const commitments = await getCommitmentsByBookingId(id)
        commitments.map(async i => {
          if (i.status === statuses.approved) {
            await updateDoc(doc(db, 'commitments', i.id), {
              status: statuses.bookingCanceled,
              reason,
              updatedAt: getLocalTime().format(),
            })
          }
        })
        await updateBookingStore(id)
      }
      alertStore.info({ content: `Booking ${status}!` })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const duplicateBooking = async booking => {
    const bookingId = uid(28)

    try {
      await setDoc(doc(collection(db, 'bookings'), bookingId), {
        ...booking,
        committed: 0,
        createdAt: getLocalTime().format(),
        updatedAt: getLocalTime().format(),
        entities: [],
        carriers: [],
        status: '',
      })
      alertStore.info({ content: 'Duplicated booking' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const deleteBooking = async (id, draft = false, fromHistory = false) => {
    try {
      if (draft) {
        const index = drafts.value.findIndex(i => i.id === id)
        if (index > -1) {
          drafts.value.splice(index, 1)
          await deleteDoc(doc(db, 'drafts', id))
          alertStore.info({ content: 'Draft was deleted' })
        } else alertStore.warning({ content: 'Draft not found' })
      } else if (fromHistory) {
        const index = pastBookings.value.findIndex(i => i.id === id)
        debugger
        if (index > -1) {
          pastBookings.value.splice(index, 1)
          await deleteDoc(doc(db, 'bookings', id))
          alertStore.info({ content: 'Bookings removed!' })
        }
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
  const reactivateBooking = async booking => {
    const bookingId = uid(28)
    try {
      await deleteDoc(doc(db, 'bookings', booking.id))
      await setDoc(doc(collection(db, 'bookings'), bookingId), {
        ...booking,
        committed: 0,
        id: bookingId,
        status: statuses.active,
        updatedAt: getLocalTime().format(),
        carriers: [],
      })
      alertStore.info({ content: 'Reactivated booking' })
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
  const updateBooking = async (booking, collectionName, completedStatus = false) => {
    try {
      await updateDoc(doc(db, collectionName, booking.id), { ...booking })
      if (!completedStatus) {
        alertStore.info({
          content: `${capitalize(collectionName).charAt(0) + collectionName.slice(1)} updated`,
        })
      }
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
      }, 3000)
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
    pastBookings,
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
    getBookingHistory,
    reactivateBooking,
    updateBookingStore,
    reset,
    duplicateBooking,
    closeBookingExpansion,
  }
})
