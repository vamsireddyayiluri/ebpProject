import { defineStore } from 'pinia'
import bookingsData from '~/fixtures/bookings.json'
import {useAlertStore} from "~/stores/alert.store"
import {uid} from "uid"

export const useBookingsStore = defineStore('bookings', () => {
  const alertStore = useAlertStore()
  const bookings = ref(bookingsData)

  const createBooking = booking => {
    const newBooking = { ...booking, id: uid() }
    bookings.value.push(newBooking)
  }

  const deleteBooking = async id => {
    try {
      const index = bookings.value.findIndex(i => i.id === id)
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (index > -1) {
            bookings.value.splice(index, 1)
            resolve()
            alertStore.info({ content: 'Bookings was deleted' })
          }
        }, 200)
      })
    } catch (e) {
      alertStore.info({ content: e})
    }
  }

  return {
    bookings,
    createBooking,
    deleteBooking,
  }
})
