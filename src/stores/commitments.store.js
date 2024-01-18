import { defineStore } from 'pinia'
import {collection, doc, getDocs, updateDoc, where} from 'firebase/firestore'
import { db } from '~/firebase'
import { statuses } from '~/constants/statuses'
import { useAlertStore } from '~/stores/alert.store'
import {useAuthStore} from "~/stores/auth.store"
import {useBookingsStore} from "~/stores/bookings.store"

export const useCommitmentsStore = defineStore('commitments', () => {
  const alertStore = useAlertStore()
  const bookingsStore = useBookingsStore()

  const approveCommitment = async id => {
    try {
      await updateDoc(doc(db, 'commitments', id), {
        status: statuses.approved,
      })
      bookingsStore.bookings.forEach(i => {
        i.entities.forEach(j => {
          i.expand = true
          if (j.id === id) {
            j.status = statuses.approved
          }
        })
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const onboardCommitment = async id => {
    try {
      await updateDoc(doc(db, 'commitments', id), {
        status: statuses.onboarded,
      })
      bookingsStore.bookings.forEach(i => {
        i.entities.forEach(j => {
          i.expand = true
          if (j.id === id) {
            j.status = statuses.onboarded
          }
        })
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const declineCommitment = async id => {
    try {
      await updateDoc(doc(db, 'commitments', id), {
        status: statuses.declined,
      })
      bookingsStore.bookings.forEach(i => {
        i.entities.forEach(j => {
          i.expand = true
          if (j.id === id) {
            j.status = statuses.declined
          }
        })
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  return {
    approveCommitment,
    onboardCommitment,
    declineCommitment,
  }
})
