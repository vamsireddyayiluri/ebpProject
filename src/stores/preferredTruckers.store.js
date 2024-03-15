import { defineStore } from 'pinia'
import allTruckers from '~/fixtures/truckers.json'
import { useAlertStore } from '~/stores/alert.store'
import { useAuthStore } from '~/stores/auth.store'
import { addDoc, arrayRemove, arrayUnion, collection, doc, updateDoc } from 'firebase/firestore'
import { db } from '~/firebase'

export const usePreferredTruckersStore = defineStore('preferredTruckers', () => {
  const authStore = useAuthStore()
  const preferredTruckers = ref(authStore.orgData?.preferredTruckers || [])
  const alertStore = useAlertStore()

  const getPreferredTruckers = () => {
    //here need to find last booking dale (commitments with any status)
    preferredTruckers.value = authStore.orgData?.preferredTruckers
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
            `<br/><a href="https://qualle-stpv2.web.app/register">Street turn platform</a>`,
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
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const deleteTrucker = async trucker => {
    delete trucker.index
    delete trucker.selected
    const truckerToRemove = trucker
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
