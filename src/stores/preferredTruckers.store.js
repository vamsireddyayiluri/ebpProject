import { defineStore } from 'pinia'
import allTruckers from '~/fixtures/truckers.json'
import { useAlertStore } from '~/stores/alert.store'
import { useAuthStore } from '~/stores/auth.store'
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '~/firebase'
import moment from 'moment-timezone'

export const usePreferredTruckersStore = defineStore('preferredTruckers', () => {
  const authStore = useAuthStore()
  const preferredTruckers = ref([])
  const alertStore = useAlertStore()

  const getPreferredTruckers = async () => {
    try {
      preferredTruckers.value = await Promise.all(
        authStore.orgData?.preferredTruckers.map(async trucker => {
          const lastBooking = await getLastBookingDate(trucker.id)

          return { ...trucker, lastBooking }
        }),
      )
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const getLastBookingDate = async truckerId => {
    const q = await query(
      collection(db, 'commitments'),
      where('truckerOrgId', '==', truckerId),
      where('orgId', '==', authStore.orgData.orgId),
    )
    const querySnapshot = await getDocs(q)
    const lastBookingDate = querySnapshot.docs
      .map(doc => doc.data().created)
      .sort((a, b) => moment(b).diff(moment(a)))[0]

    return lastBookingDate
  }
  const inviteTrucker = async email => {
    const index = preferredTruckers?.value.findIndex(i => i?.email === email)
    if (index > -1) {
      alertStore.warning({ content: 'User exist in your list' })

      return
    }

    const ind = allTruckers.findIndex(i => i?.email === email)
    if (index > -1) resolve(allTruckers[ind])
    else {
      await sendInviteToSTP(email)

      return 'sentInvitation'
    }
  }
  const sendInviteToSTP = async email => {
    try {
      await addDoc(collection(db, 'mail'), {
        to: email,
        message: {
          subject: 'Hello from Qualle!',
          html:
            'Hello trucker <br>' +
            `Exporter ${authStore.orgData.company} invited you to the platform` +
            `<br/><a href=${import.meta.env.VITE_APP_DOMAIN}/register>Street turn platform</a>`,
        },
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const addTrucker = async trucker => {
    try {
      await updateDoc(doc(db, 'organizations', authStore.orgData.orgId), {
        preferredTruckers: arrayUnion(trucker),
      })
      preferredTruckers.value.push(trucker)
      await getPreferredTruckers()
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const deleteTrucker = async trucker => {
    const truckerToRemove = {
      id: trucker.id,
      company: trucker.company,
      email: trucker.email,
      scac: trucker.scac,
    }
    try {
      await updateDoc(doc(db, 'organizations', authStore.orgData.orgId), {
        preferredTruckers: arrayRemove(truckerToRemove),
      })
      const index = preferredTruckers.value.findIndex(i => i.id === truckerToRemove.id)
      if (index > -1) {
        preferredTruckers.value.splice(index, 1)
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  return {
    preferredTruckers,
    getPreferredTruckers,
    inviteTrucker,
    addTrucker,
    deleteTrucker,
    sendInviteToSTP,
  }
})
