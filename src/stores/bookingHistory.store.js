import { defineStore } from 'pinia'
import bookingHistoryData from '~/fixtures/bookingHistory.json'
import { useAlertStore } from '~/stores/alert.store'

export const useBookingHistoryStore = defineStore('bookingHistory', () => {
  const alertStore = useAlertStore()
  const bookings = ref(bookingHistoryData)

  const deleteBooking = async id => {
    try {
      const index = bookings.value.findIndex(i => i.id === id)
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (index > -1) {
            bookings.value.splice(index, 1)
            resolve()
            alertStore.info({ content: 'Bookings was deleted from history' })
          }
        }, 200)
      })
    } catch (e) {
      alertStore.info({ content: e })
    }
  }

  return {
    bookings,
    deleteBooking,
  }
})
