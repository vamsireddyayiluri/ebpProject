import { defineStore } from 'pinia'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '~/firebase'
import { statuses } from '~/constants/statuses'
import { useAlertStore } from '~/stores/alert.store'
import { useBookingsStore } from '~/stores/bookings.store'
import { onboardingCodes } from '~/constants/reasonCodes'

export const useCommitmentsStore = defineStore('commitments', () => {
  const alertStore = useAlertStore()
  const bookingsStore = useBookingsStore()

  const approveCommitment = async commitment => {
    // find booking
    const booking = bookingsStore.bookings.find(i => i.id === commitment.bookingId)
    const availableContainers = booking.containers - booking.committed

    //throw error if commitment capacity is not available
    if (availableContainers < +commitment.committed) {
      alertStore.warning({ content:  `You can only commit ${availableContainers} containers`})

      return
    }
    try {
      await updateDoc(doc(db, 'commitments', commitment.id), {
        status: statuses.approved,
      })
      bookingsStore.bookings.forEach(i => {
        i.entities.forEach(j => {
          i.expand = true
          if (j.id === commitment.id) {
            j.status = statuses.approved
          }
        })
      })
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
          i.expand = true
          if (j.id === id) {
            j.status = obj.status,
            (obj.reason? obj.reason: {})
          }
        })
      })
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
          i.expand = true
          if (j.id === id) {
            j.status = statuses.declined,
            reason
          }
        })
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  return {
    approveCommitment,
    completeCommitment,
    declineCommitment,
  }
})
