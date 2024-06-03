import { defineStore } from 'pinia'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '~/firebase'
import { statuses } from '~/constants/statuses'
import { useAlertStore } from '~/stores/alert.store'
import { useBookingsStore } from '~/stores/bookings.store'
import { onboardingCodes } from '~/constants/reasonCodes'
import { getRequestLoadFee } from './helpers'
import { getLocalTime } from '@qualle-admin/qutil/dist/date'
import moment from 'moment-timezone'
import { uid } from 'uid'
import { calculateLoadFee } from '~/helpers/stripe'

const { updateBookingStore } = useBookingsStore()

export const useCommitmentsStore = defineStore('commitments', () => {
  const alertStore = useAlertStore()
  const bookingsStore = useBookingsStore()

  const approveCommitment = async commitment => {
    // find booking
    const booking = bookingsStore.bookings.find(i => {
      return (
        i.id === commitment.bookingId ||
        (Array.isArray(i.ids) && i.ids.includes(commitment.bookingId))
      )
    })

    const details = booking.details.find(obj => obj.id === commitment.bookingId)
    const availableContainers = details.containers - details?.committed

    //throw error if commitment capacity is not available
    if (!availableContainers) {
      alertStore.warning({ content: `Your booking is full.` })

      return
    } else if (availableContainers < +commitment.committed) {
      alertStore.warning({ content: `You can only commit ${availableContainers} containers` })

      return
    }
    try {
      await updateDoc(doc(db, 'commitments', commitment.id), {
        status: statuses.approved,
      })

      const carriers = await updateBookingCarriers(commitment)
      await updateDoc(doc(db, 'bookings', commitment.bookingId), {
        committed: increment(commitment.committed),
        carriers: carriers || [],
      })

      const index = bookingsStore.bookings.findIndex(i => i.ids.includes(commitment.bookingId))
      bookingsStore.bookings[index].entities.forEach(j => {
        // i.expand = true
        if (j.id === commitment.id) {
          j.status = statuses.approved
        }
      })

      await updateBookingStore(commitment, 'approved')

      alertStore.info({ content: 'Booking commitment approved' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const updateBookingCarriers = async commitment => {
    const booking = await bookingsStore.getBooking({ id: commitment.bookingId })
    const truckerScac = commitment?.details.truckerDetails.truckerScac
    const carrierIndex = booking?.carriers?.findIndex(carrier => carrier?.scac === truckerScac)
    if (booking?.carriers?.length && carrierIndex !== -1) {
      booking.carriers[carrierIndex].approved =
        booking.carriers[carrierIndex].approved + commitment.committed
    } else {
      if (booking?.carriers?.length) {
        booking.carriers.push({
          scac: truckerScac,
          approved: commitment.committed,
          onboarded: 0,
          email: commitment.truckerEmail,
          company: commitment.truckerCompany,
        })
      } else {
        booking.carriers = [
          {
            scac: truckerScac,
            approved: commitment.committed,
            onboarded: 0,
            email: commitment.truckerEmail,
            company: commitment.truckerCompany,
          },
        ]
      }
    }

    return booking.carriers
  }

  const updateBookingCarriers2 = async (commitment, onBoardedContainers) => {
    const booking = await bookingsStore.getBooking({ id: commitment.bookingId })
    const truckerScac = commitment?.details.truckerDetails.truckerScac
    const carrierIndex = booking?.carriers?.findIndex(carrier => carrier?.scac === truckerScac)
    if (carrierIndex !== -1) {
      booking.carriers[carrierIndex].onboarded =
        booking?.carriers[carrierIndex].onboarded + onBoardedContainers
    }
    await updateDoc(doc(db, 'bookings', commitment.bookingId), {
      carriers: booking?.carriers,
    })
  }

  const completeCommitment = async (data, reason, onBoardedContainers) => {
    let obj = {}
    if (onboardingCodes.onboarded === reason) {
      obj.status = statuses.onboarded
      await updateBookingCarriers2(data, onBoardedContainers)
    } else if (onboardingCodes.onboardMovedLoad === reason) {
      // Calculating marketplace fee if trucker moved different loads

      const chargesData = await calculateLoadFee(data, onBoardedContainers)
      obj = {
        loadFee: chargesData.loadFee,
        amountBreakup: chargesData.amountBreakup,
        status: statuses.onboarded,
        onBoardedContainers: onBoardedContainers,
      }

      await updateBookingCarriers2(data, onBoardedContainers)
    } else {
      obj.status = statuses.incomplete
      obj.reason = reason
    }
    obj.onBoarded = data?.onBoarded ? data.onBoarded + onBoardedContainers : onBoardedContainers
    try {
      await updateDoc(doc(db, 'commitments', data.id), {
        ...obj,
      })
      const index = bookingsStore.bookings.findIndex(i => i.ids.includes(data.bookingId))
      bookingsStore.bookings[index]?.entities?.forEach(j => {
        // i.expand = true
        if (j.id === data.id) {
          j.status = obj.status
          j.reason = reason
        }
      })

      const commitment = await getCommitment(data.id)
      await updateBookingStore(commitment)

      // find booking
      const booking = bookingsStore.bookings.find(i => {
        return (
          i.id === commitment.bookingId ||
          (Array.isArray(i.ids) && i.ids.includes(commitment.bookingId))
        )
      })
      alertStore.info({ content: 'Booking commitment completed' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const declineCommitment = async (commitment, reason) => {
    try {
      await updateDoc(doc(db, 'commitments', commitment.id), {
        status: statuses.declined,
        reason,
      })
      const index = bookingsStore.bookings.findIndex(i => i.ids.includes(commitment.bookingId))
      bookingsStore.bookings[index].entities.forEach(j => {
        if (j.id === commitment.id) {
          j.status = statuses.declined
          j.reason = reason
        }
      })

      await updateBookingStore(commitment)
      alertStore.info({ content: 'Booking commitment declined' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const cancelCommitment = async (commitment, reason) => {
    try {
      await updateDoc(doc(db, 'commitments', commitment.id), {
        status: statuses.canceled,
        reason,
      })
      const index = bookingsStore.bookings.findIndex(i => i.ids.includes(commitment.bookingId))
      bookingsStore.bookings[index].entities.forEach(j => {
        if (j.id === commitment.id) {
          j.status = statuses.canceled
          j.reason = reason
        }
      })

      /*// find booking
      const booking = bookingsStore.allBookings.find(i => i.id === commitment.bookingId)
      if (booking?.carriers) {
        const truckerScac = commitment?.details.truckerDetails.truckerScac
        const carrierIndex = booking?.carriers?.findIndex(carrier => carrier?.scac === truckerScac)
        if (carrierIndex !== -1) {
          booking.carriers[carrierIndex].approved =
            booking.carriers[carrierIndex].approved - commitment.committed
        }
      }
      await updateDoc(doc(db, 'bookings', commitment.bookingId), {
        carriers: booking?.carriers,
      })*/
      await updateBookingStore(commitment, 'canceled')
      alertStore.info({ content: 'Booking commitment canceled' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const edit_commitment_loadingDate = async (data, loadingDate, newCommitted) => {
    try {
      let actualCommited = null
      let updatedCommmitment = null
      let updatedData = null
      if (data.committed === newCommitted) {
        actualCommited = newCommitted
        await updateDoc(doc(db, 'commitments', data.id), {
          loadingDate: moment(loadingDate).endOf('day').format(),
          updated: getLocalTime().format(),
        })
      } else {
        actualCommited = data.committed - newCommitted

        const chargesData = await calculateLoadFee(data, actualCommited)
        updatedData = {
          committed: actualCommited,
          updated: getLocalTime().format(),
          loadFee: chargesData.loadFee,
          amountBreakup: chargesData.amountBreakup,
        }
        await updateDoc(doc(db, 'commitments', data.id), updatedData)
        await createCommitment(data, newCommitted, loadingDate)
      }
      bookingsStore.bookings.forEach(i => {
        i.entities.forEach(j => {
          if (j.id === data.id) {
            if (data.committed === newCommitted) {
              j.loadingDate = moment(loadingDate).endOf('day').format()
            } else {
              j.loadingDate = moment(data.loadingDate).endOf('day').format()
              j.committed = actualCommited
              j.loadFee = updatedData.loadFee
              j.amountBreakup = updatedData.amountBreakup
            }
            updatedCommmitment = j
          }
        })
      })
      alertStore.info({ content: 'Booking commitment updated' })
      if (data.committed !== newCommitted) {
        return updatedCommmitment
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const createCommitmentObj = async (commitment, newCommitted, loadingDate) => {
    const allocationId = uid(28)
    const chargesData = await calculateLoadFee(commitment, newCommitted)

    return {
      ...commitment,
      loadingDate: loadingDate,
      status: 'approved',
      created: getLocalTime().format(),
      updated: getLocalTime().format(),
      id: allocationId,
      committed: newCommitted,
      loadFee: chargesData.loadFee,
      amountBreakup: chargesData.amountBreakup,
    }
  }

  const createCommitment = async (data, newCommitted, loadingDate) => {
    try {
      const newCommitment = await createCommitmentObj(data, newCommitted, loadingDate)
      const docRef = doc(collection(db, 'commitments'), newCommitment.id)
      await setDoc(docRef, newCommitment)
      bookingsStore.bookings.map(i => {
        if (i.id === newCommitment.bookingId) {
          i.entities.push(newCommitment)
        }
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const getCommitment = async id => {
    try {
      const docData = await getDoc(doc(db, 'commitments', id))

      return docData.data()
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const getExpiredCommitments = async geohash => {
    if (!bookingsStore.allBookings.length) {
      await bookingsStore.getBookings({})
    }
    try {
      const pendingCommitments = []
      const pendingBookings = bookingsStore.allBookings.filter(
        val =>
          (val.status === 'active' || val.status === 'pending') && val.location.geohash === geohash,
      )

      if (pendingBookings.length) {
        const pendingCommitmentsPromises = pendingBookings.map(async obj => {
          const today = getLocalTime().format()
          const query34 = query(
            collection(db, 'commitments'),
            where('bookingId', '==', obj.id),
            where('status', '==', 'approved'),
            where('loadingDate', '<', today),
          )
          const snapshotData = await getDocs(query34)
          let commitments = snapshotData.docs.map(doc => doc.data())
          if (commitments?.length) {
            pendingCommitments.push(...commitments)
          }
        })

        // Wait for all promises to be resolved
        await Promise.all(pendingCommitmentsPromises)

        return pendingCommitments
      } else {
        return pendingCommitments
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  return {
    getCommitment,
    approveCommitment,
    completeCommitment,
    declineCommitment,
    cancelCommitment,
    edit_commitment_loadingDate,
    getExpiredCommitments,
  }
})
