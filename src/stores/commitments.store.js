import { defineStore } from 'pinia'
import { doc, getDoc, increment, updateDoc } from 'firebase/firestore'
import { db } from '~/firebase'
import { statuses } from '~/constants/statuses'
import { useAlertStore } from '~/stores/alert.store'
import { useBookingsStore } from '~/stores/bookings.store'
import { onboardingCodes } from '~/constants/reasonCodes'
import { getRequestLoadFee } from './helpers'
import { getLocalTime } from '@qualle-admin/qutil/dist/date'
import moment from 'moment-timezone'

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
      if (booking?.carriers) {
        const truckerScac = commitment?.details.truckerDetails.truckerScac
        const carrierIndex = booking?.carriers?.findIndex(carrier => carrier?.scac === truckerScac)
        if (carrierIndex !== -1) {
          booking.carriers[carrierIndex].total =
            booking.carriers[carrierIndex].total + commitment.committed
        } else {
          booking.carriers.push({
            scac: truckerScac,
            fulfilled: 0,
            total: commitment.committed,
          })
        }
      }
      await updateDoc(doc(db, 'bookings', commitment.bookingId), {
        committed: increment(commitment.committed),
        carriers: booking?.carriers || [],
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
  const completeCommitment = async (data, reason, onBoardedContainers=0) => {
    let obj = {}
    if (onboardingCodes.onboarded === reason) {
      obj.status = statuses.onboarded
    } else if (onboardingCodes.onboardMovedLoad === reason) {
      // Calculating marketplace fee if trucker moved different loads

      const { marketplaceFeePercentage, processingFee } = await getRequestLoadFee()
      const truckerRevenue = data.estimatedRate * onBoardedContainers
      const marketPlaceFee = parseFloat(
        ((truckerRevenue / 100) * marketplaceFeePercentage).toFixed(2),
      )

      const stripeCharge = (marketPlaceFee / 100) * processingFee.percentage
      const finalFee = stripeCharge + processingFee.cents / 100
      const processingFeeAmount = parseFloat(finalFee.toFixed(2))

      const loadFee = parseFloat(processingFeeAmount + marketPlaceFee).toFixed(2)
      const amountBreakup = {
        baseFee: marketPlaceFee,
        processingFee: parseFloat(processingFeeAmount.toFixed(2)),
      }
      obj = {
        loadFee,
        amountBreakup,
        status: statuses.onboarded,
        onBoardedContainers: onBoardedContainers,
      }
    } else {
      obj.status = statuses.incomplete
      obj.reason = reason
    }
    obj.onBoarded = data?.onBoarded? data.onBoarded + onBoardedContainers: onBoardedContainers
    try {
      await updateDoc(doc(db, 'commitments', data.id), {
        ...obj,
      })
      const index = bookingsStore.bookings.findIndex(i => i.ids.includes(data.bookingId))
      bookingsStore.bookings[index].entities.forEach(j => {
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
      const truckerScac = commitment?.details.truckerDetails.truckerScac
      const carrierIndex = booking?.carriers?.findIndex(carrier => carrier?.scac === truckerScac)
      if (carrierIndex !== -1) {
        booking.carriers[carrierIndex].fulfilled += onBoardedContainers
      }
      await updateDoc(doc(db, 'bookings', commitment.bookingId), {
        carriers: booking.carriers,
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
      await updateBookingStore(commitment, 'canceled')
      alertStore.info({ content: 'Booking commitment canceled' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const edit_commitment_loadingDate = async (id, loadingDate) => {
    try {
      await updateDoc(doc(db, 'commitments', id), {
        loadingDate: moment(loadingDate).endOf('day').format(),
        updated: getLocalTime().format(),
      })
      bookingsStore.bookings.forEach(i => {
        i.entities.forEach(j => {
          if (j.id === id) {
            j.loadingDate = moment(loadingDate).endOf('day').format()
          }
        })
      })
      alertStore.info({ content: 'Booking commitment updated' })
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
    edit_commitment_loadingDate,
  }
})
