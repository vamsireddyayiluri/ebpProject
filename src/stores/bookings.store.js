import { defineStore } from 'pinia'
import bookingsData from '~/fixtures/bookings.json'
import draftsData from '~/fixtures/drafts.json'
import { useAlertStore } from '~/stores/alert.store'
import { uid } from 'uid'

export const useBookingsStore = defineStore('bookings', () => {
  const alertStore = useAlertStore()
  const bookings = ref(bookingsData)
  const drafts = ref(draftsData)

  const createBooking = booking => {
    const newBooking = { ...booking, id: uid() }
    bookings.value.push(newBooking)
  }
  const createDraft = draft => {
    drafts.value.push({ ...draft, id: uid() })
    alertStore.info({ content: 'Draft was added' })
  }
  const deleteBooking = async (id, draft = false) => {
    try {
      if (draft) {
        const index = drafts.value.findIndex(i => i.id === id)
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (index > -1) {
              drafts.value.splice(index, 1)
              resolve()
              alertStore.info({ content: 'Draft was deleted' })
            }
          }, 200)
        })

        return
      }
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
      alertStore.info({ content: e })
    }
  }

  return {
    bookings,
    drafts,
    createBooking,
    deleteBooking,
    createDraft,
  }
})
