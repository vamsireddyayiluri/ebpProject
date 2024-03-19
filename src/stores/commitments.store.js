import { defineStore } from 'pinia'
import { doc, updateDoc, getDoc, increment } from 'firebase/firestore'
import { db } from '~/firebase'
import { statuses } from '~/constants/statuses'
import { useAlertStore } from '~/stores/alert.store'
import { useBookingsStore } from '~/stores/bookings.store'
const { updateBookingStore } = useBookingsStore()

import { onboardingCodes } from '~/constants/reasonCodes'

export const useCommitmentsStore = defineStore('commitments', () => {
  const alertStore = useAlertStore()
  const bookingsStore = useBookingsStore()

  const approveCommitment = async commitment => {
    // find booking
    const booking = bookingsStore.bookings.find(i => i.id === commitment.bookingId)
    const availableContainers = booking.containers - booking.committed

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
      const carrierIndex = booking.carriers.findIndex(carrier => carrier.scac === commitment.scac)
      if (carrierIndex !== -1) {
        booking.carriers[carrierIndex].total =
          booking.carriers[carrierIndex].total + commitment.committed
      } else {
        booking.carriers.push({
          scac: commitment.scac,
          fulfilled: 0,
          total: commitment.committed,
        })
      }
      await updateDoc(doc(db, 'bookings', commitment.bookingId), {
        committed: increment(commitment.committed),
        carriers: booking.carriers,
      })

      const index = bookingsStore.bookings.findIndex(i => i.id === commitment.bookingId)

      bookingsStore.bookings[index].entities.forEach(j => {
        // i.expand = true
        if (j.id === commitment.id) {
          j.status = statuses.approved
        }
      })
      await updateBookingStore(commitment.bookingId)

      alertStore.info({ content: 'Booking commitment approved' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const completeCommitment = async (id, reason) => {
    const obj = {}
    if (onboardingCodes.onboarded === reason || onboardingCodes.onboardMovedLoad === reason) {
      obj.status = statuses.onboarded
    } else {
      obj.status = statuses.incomplete
      obj.reason = reason
    }
    try {
      await updateDoc(doc(db, 'commitments', id), {
        ...obj,
      })
      bookingsStore.bookings.forEach(i => {
        i.entities.forEach(j => {
          // i.expand = true
          if (j.id === id) {
            ;(j.status = obj.status), (j.reason = reason)
          }
        })
      })
      const commitment = await getCommitment(id)
      await updateBookingStore(commitment.bookingId)
      alertStore.info({ content: 'Booking commitment completed' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const declineCommitment = async (id, reason) => {
    try {
      await updateDoc(doc(db, 'commitments', id), {
        status: statuses.declined,
        reason,
      })
      bookingsStore.bookings.forEach(i => {
        i.entities.forEach(j => {
          // i.expand = true
          if (j.id === id) {
            ;(j.status = statuses.declined), (j.reason = reason)
          }
        })
      })
      const commitment = await getCommitment(id)
      await updateBookingStore(commitment.bookingId)
      alertStore.info({ content: 'Booking commitment declined' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const cancelCommitment = async (id, reason) => {
    try {
      await updateDoc(doc(db, 'commitments', id), {
        status: statuses.canceled,
        reason,
      })
      bookingsStore.bookings.forEach(i => {
        i.entities.forEach(j => {
          if (j.id === id) {
            ;(j.status = statuses.canceled), (j.reason = reason)
          }
        })
      })
      const commitment = await getCommitment(id)
      await updateBookingStore(commitment.bookingId)
      alertStore.info({ content: 'Booking commitment canceled' })
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

  return {
    getCommitment,
    approveCommitment,
    completeCommitment,
    declineCommitment,
    cancelCommitment,
  }
})
