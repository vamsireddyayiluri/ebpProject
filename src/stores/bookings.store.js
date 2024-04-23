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
  writeBatch,
} from 'firebase/firestore'
import { db } from '~/firebase'
import { useAuthStore } from '~/stores/auth.store'
import { getLocalServerTime, getLocalTime } from '@qualle-admin/qutil/dist/date'
import { capitalize, cloneDeep, pickBy } from 'lodash'
import moment from 'moment-timezone'
import { statuses } from '~/constants/statuses'
import { usePreferredTruckersStore } from '~/stores/preferredTruckers.store'
import { useBookingRulesStore } from '~/stores/bookingRules.store'

import { groupBookings } from '~/stores/helpers'

export const useBookingsStore = defineStore('bookings', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const { preferredTruckers } = usePreferredTruckersStore()
  let bookings = ref([])
  let allBookings = ref([])

  const notGroupedBookings = ref([])
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
    allBookings.value = data.sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)))
    await validateBookingsExpiry(data)
  }
  const getBookings = async ({ draft = false }) => {
    loading.value = true
    const { orgId } = authStore.userData
    if (draft) {
      const draftsQuery = query(collection(db, 'drafts'), where('orgId', '==', orgId))
      const querySnapshot = await getDocs(draftsQuery)

      const filteredtest = querySnapshot.docs.map(doc => doc.data())
      const group = groupBookings(filteredtest)

      drafts.value = group
    } else {
      await getallBookings()
      const today = getLocalServerTime(moment(), 'America/Los_Angeles')
      const filteredBookings = bookings.value.filter(
        booking =>
          !moment(booking.loadingDate).isBefore(moment(today)) &&
          booking.status !== statuses.completed &&
          booking.status !== statuses.expired &&
          booking.status !== statuses.canceled,
      )
      notGroupedBookings.value = filteredBookings
      const group = groupBookings(filteredBookings)
      bookings.value = group
    }
    loading.value = false
  }
  const getBookingHistory = async () => {
    loading.value = true
    const today = getLocalServerTime(moment(), 'America/Los_Angeles')
    await getallBookings()
    const filteredBookings = bookings.value.filter(
      booking =>
        moment(booking.loadingDate).isBefore(moment(today)) ||
        booking.status === statuses.completed ||
        booking.status === statuses.expired ||
        booking.status === statuses.canceled,
    )

    // const pastbook = await validateBookingsExpiry(filteredBookings)
    const group = groupBookings(filteredBookings)
    pastBookings.value = group
    loading.value = false
  }
  const getCommitmentsByBookingId = async (id, ids, fromHistory = false) => {
    const allCommitments = []
    await Promise.all(
      ids.map(async bookingId => {
        const q = await query(collection(db, 'commitments'), where('bookingId', '==', bookingId))
        const docData = await getDocs(q)
        const commitments = docData.docs
          .map(doc => doc.data())
          .sort((a, b) => moment(b.commitmentDate).diff(moment(a.commitmentDate)))
        allCommitments.push(...commitments)
      }),
    )
    if (!fromHistory) {
      await updateBookingCommitments(id, allCommitments)
    }

    return allCommitments
  }
  const updateBookingCommitments = async (id, commitments) => {
    bookings.value.forEach(b => {
      if (b.id == id) {
        b['entities'] = commitments
        b.expand = true
      }
    })
  }
  const validateBookingsExpiry = async bookings => {
    const today = getLocalServerTime(moment(), 'America/Los_Angeles')
    const updateBookings = []
    for (const b of bookings) {
      if (moment(b.loadingDate).isBefore(moment(today)) || b.status === 'completed') {
        const updatedBookingData = {
          ...b,
          status: b.status === 'completed' ? b.status : statuses.expired,
          updatedAt: getLocalTime().format(),
        }

        updateBookings.push(updatedBookingData)

        // updatePromises.push(updateBooking(updatedBookingData, 'bookings', true))
      }
    }

    return updateBookings
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

  const getBookingsByIds = async ({ bookingIds, draft = false }) => {
    try {
      const q = query(collection(db, draft ? 'drafts' : 'bookings'), where('id', 'in', bookingIds))
      const querySnapshot = await getDocs(q)

      const results = querySnapshot.docs.map(doc => doc.data())

      return results
    } catch (e) {
      alertStore.info({ content: 'Booking not found' })
    }
  }
  const createBookingObj = booking => {
    const { rules } = useBookingRulesStore()

    const { user_id: userId, name, orgId, type } = authStore.userData
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
      preferredDays: rules?.preferredCarrierWindow,
      status: statuses.active,
      createdBy: {
        userId,
        name,
        type,
        ...(authStore.userData?.workerId ? { workerId: authStore.userData.workerId } : {}),
      },
    }
  }
  const createBooking = async (selectedBooking, details) => {
    try {
      const batch = writeBatch(db)
      details.forEach(b => {
        const newBooking = createBookingObj({ ...selectedBooking, ...b })
        const docRef = doc(collection(db, 'bookings'), newBooking.id)
        batch.set(docRef, newBooking)
        notGroupedBookings.value.unshift(newBooking)
      })

      await batch.commit()

      bookings.value.length = 0
      bookings.value.push(...groupBookings(notGroupedBookings.value))
      alertStore.info({ content: `Booking Created!` })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const createDraft = async (selectedDraft, details) => {
    try {
      const batch = writeBatch(db)
      details.forEach(b => {
        const newDraft = createBookingObj({ ...selectedDraft, ...b })
        const docRef = doc(collection(db, 'drafts'), newDraft.id)
        batch.set(docRef, newDraft)
        drafts.value.unshift(newDraft)
      })
      await batch.commit()
      const group = groupBookings(drafts.value)
      drafts.value.length = 0
      drafts.value.push(...group)
      alertStore.info({ content: `Draft Created!` })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const updateBookingStatus = async (booking, status, reason) => {
    try {
      const ids = booking.ids
      const batch = writeBatch(db)

      ids.forEach(async id => {
        const docref = doc(db, 'bookings', id)
        batch.update(docref, {
          status,
          ...(reason ? { reason: reason?.trim() } : {}),
        })
      })
      batch.commit()
      bookings.value.forEach(b => {
        const ids = b.ids
        if (ids.includes(booking.id)) {
          b.status = status
        }
      })
      if (status === statuses.canceled) {
        const index = bookings.value.findIndex(i => {
          return i.ids.includes(booking.id)
        })
        bookings.value.splice(index, 1)
        notGroupedBookings.value.splice(index, 1)

        const commitments = await getCommitmentsByBookingId(booking.id, booking.ids)
        commitments.map(async i => {
          if (i.status === statuses.approved) {
            await updateDoc(doc(db, 'commitments', i.id), {
              status: statuses.bookingCanceled,
              reason,
              updatedAt: getLocalTime().format(),
            })
          }
        })
        await updateBookingStore(booking)
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

  // deleting multiple bookings using ids array
  const deleteBooking = async (booking, draft = false, fromHistory = false) => {
    try {
      const batch = writeBatch(db)

      if (draft) {
        const index = drafts.value.findIndex(i => booking.includes(i.id))
        if (index > -1) {
          booking.forEach(id => {
            batch.delete(doc(db, 'drafts', id))
          })
          drafts.value.splice(index, 1)
          alertStore.info({ content: 'Draft was deleted' })
        }
      } else if (fromHistory) {
        const index = pastBookings.value.findIndex(i => booking.includes(i.id))
        if (index > -1) {
          pastBookings.value.splice(index, 1)

          booking.forEach(id => {
            batch.delete(doc(db, 'bookings', id))
          })
          // await deleteDoc(doc(db, 'bookings', id))
          alertStore.info({ content: 'Bookings removed!' })
        }
      } else {
        const ids = booking.ids

        ids.forEach(async id => {
          batch.delete(doc(db, 'bookings', id))
        })
        const index = bookings.value.findIndex(i => {
          return ids.includes(i.id)
        })
        if (index > -1) {
          bookings.value.splice(index, 1)
          notGroupedBookings.value.splice(index, 1)
          alertStore.info({ content: 'Bookings removed!' })
        } else alertStore.warning({ content: 'Booking not found' })
      }
      await batch.commit()
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const publishDraft = async booking => {
    try {
      const batch = writeBatch(db)
      await deleteBooking(booking.ids, true)
      booking.ids.forEach(id => {
        const data = createEditedBookingObj(booking, id)
        const docRef = doc(collection(db, 'bookings'), id)
        batch.set(docRef, data)
      })

      await batch.commit()
      bookings.value.unshift(booking)
      alertStore.info({ content: `Booking Ref# ${booking.ref} was published` })

      return 'published'
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const reactivateBooking = async booking => {
    try {
      await deleteBooking(booking.ids, false, true)
      const batch = writeBatch(db)
      booking.ids.forEach(id => {
        const bookingId = uid(28)

        const newData = createEditedBookingObj(booking, id)
        batch.set(doc(collection(db, 'bookings'), bookingId), {
          ...newData,
          committed: 0,
          id: bookingId,
          status: statuses.active,
          updatedAt: getLocalTime().format(),
          carriers: [],
        })
      })
      await batch.commit()
      alertStore.info({ content: 'Reactivated booking' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const createEditedBookingObj = (booking, id) => {
    const loadingDate = booking.details.find(val => val.id === id)
    const data = { ...booking, ...loadingDate, entities: [] }

    delete data['details']
    delete data['ids']

    return data
  }
  const removeFromNetwork = async booking => {
    try {
      await deleteBooking(booking)
      const batch = writeBatch(db)
      booking.ids.forEach(id => {
        const data = createEditedBookingObj(booking, id)
        const newDraft = createBookingObj(data)
        batch.set(doc(collection(db, 'drafts'), newDraft.id), newDraft)
      })
      await batch.commit()
      drafts.value.unshift(booking)
      alertStore.info({ content: `Booking Ref# ${booking.ref} moved to the draft` })
      return 'deleted'
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const updateBooking = async (booking, ids, collectionName, completedStatus = false) => {
    try {
      const { details } = booking || { details: [] }

      const data = pickBy(booking, (value, key) => key !== 'details') || {}
      const batch = writeBatch(db)

      for (const id of ids) {
        const docRef = doc(db, collectionName, id)
        const loadData = details?.find(val => val.id === id)
        if (loadData) {
          data.loadingDate = moment(loadData.loadingDate).endOf('day').format()
          data.containers = loadData.containers
          data.scacList = loadData.scacList
        }
        if (Object.keys(data).length) {
          batch.update(docRef, { ...data })
        }

        // change loadingData in commitments
        const commitments = await getCommitmentsByBookingId(id, ids)
        commitments.map(async i => {
          await updateDoc(doc(db, 'commitments', i.id), {
            loadingDate: details?.find(val => val.id === i.bookingId).loadingDate,
            updatedAt: getLocalTime().format(),
          })
        })
      }
      await batch.commit()
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
  const updateBookingStore = async (commitment, type = null) => {
    try {
      setTimeout(async () => {
        const id = commitment?.bookingId || commitment.id
        const updatedBooking = await getBooking({ id: id, draft: false })
        bookings.value.forEach(booking => {
          const ids = booking.ids
          if (ids.includes(commitment.bookingId)) {
            if (type === 'approved') {
              booking.committed = commitment.committed + booking.committed
              const index = booking.details.findIndex(i => i.id === updatedBooking.id)
              booking.details[index].committed += commitment.committed || 0
              if (booking.containers === booking.committed) {
                booking.status = toRaw(updatedBooking.status)
              }
            } else if (type === 'canceled') {
              booking.committed = booking.committed - commitment.committed
              const index = booking.details.findIndex(i => i.id === updatedBooking.id)
              booking.details[index].committed -= commitment.committed || 0
              booking.status =
                updatedBooking.status === statuses.pending ? statuses.active : updatedBooking.status
            }
          }
        })

        // await getCommitmentsByBookingId(commitment.referenceId)
      }, 3000)
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  // delete single booking based on the booking id
  const deleteBookingById = async id => {
    try {
      const index = notGroupedBookings.value.findIndex(i => i.id === id)
      if (index > -1) {
        await deleteDoc(doc(db, 'bookings', id))
        notGroupedBookings.value.splice(index, 1)
        alertStore.info({ content: 'Bookings removed!' })
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const closeBookingExpansion = async id => {
    const index = bookings.value.findIndex(val => val?.id === id)
    bookings.value[index].expand = false
  }
  const reset = () => {
    bookings.value = []
    drafts.value = []
    loading.value = false
  }

  return {
    bookings,
    allBookings,
    pastBookings,
    notGroupedBookings,
    drafts,
    loading,
    getBookings,
    getCommitmentsByBookingId,
    getBooking,
    getBookingsByIds,
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
    deleteBookingById,
  }
})
