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
            } else alertStore.warning({ content: 'Draft not found' })
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
          } else alertStore.warning({ content: 'Draft not found' })
        }, 200)
      })
    } catch (e) {
      alertStore.warning({ content: e })
    }
  }
  const publishDraft = async booking => {
    try {
      await deleteBooking(booking.id, true)
      bookings.value.push(booking)
      alertStore.info({content: `Booking Ref#${booking.id} was published`})

      return 'published'
    }
    catch (e) {
      alertStore.warning({ content: e })
    }
  }
  const removeFromNetwork = async booking => {
    try {
      await deleteBooking(booking.id)
      drafts.value.push(booking)
      alertStore.info({content: `Booking Ref#${booking.id} moved to the draft`})

      return 'deleted'
    }
    catch (e) {
      alertStore.warning({ content: e })
    }
  }

  return {
    bookings,
    drafts,
    createBooking,
    deleteBooking,
    createDraft,
    publishDraft,
    removeFromNetwork,
  }
})
