import { defineStore } from 'pinia'
import preferredTruckersData from '~/fixtures/preferredTruckers.json'
import allTruckers from '~/fixtures/truckers.json'
import { useAlertStore } from "~/stores/alert.store"

export const usePreferredTruckersStore = defineStore('preferredTruckers', () => {
  const preferredTruckers = ref(preferredTruckersData)
  const alertStore = useAlertStore()

  const inviteTrucker = email => {
    const index = preferredTruckers.value.findIndex(i => i?.email === email)
    if (index > -1) {
      alertStore.warning({ content: 'User exist in your list' })

      return
    }

    return new Promise(resolve => {
      setTimeout(() => {
        const index = allTruckers.findIndex(i => i?.email === email)
        if (index > -1) resolve(allTruckers[index])
        else resolve('sentInvitation')
      }, 500)
    })
  }
  const addTrucker = trucker => {
    preferredTruckers.value.push(trucker)
  }
  const deleteTrucker = email => {
    const index = preferredTruckers.value.findIndex(i => i.email === email)

    return new Promise(resolve => {
      setTimeout(() => {
        if (index > -1) preferredTruckers.value.splice(index, 1), resolve('deleted')
      }, 200)
    })
  }

  return {
    preferredTruckers,
    inviteTrucker,
    addTrucker,
    deleteTrucker,
  }
})
