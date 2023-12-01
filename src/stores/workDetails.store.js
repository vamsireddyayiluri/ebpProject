import { defineStore } from 'pinia'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAuthStore } from '~/stores/auth.store'
import { useAlertStore } from "~/stores/alert.store"

export const useWorkDetailsStore = defineStore('workDetails', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const yards = ref([])

  const getYards = () => {
    yards.value = authStore.orgData.workDetails.map(i => {
      return {
        ...i,
        text:
        `Commodity: ${i.commodity}`,
      }
    })
  }
  const addYard = yard => {
    yards.value.push(yard)
  }
  const removeYard = yardId => {
    const index = yards.value.findIndex(q => q.id === yardId)
    yards.value.splice(index, 1)
  }
  const saveYards = async yards => {
    const { orgData } = useAuthStore()
    try {
      await updateDoc(doc(db, 'organizations', orgData.orgId), {
        workDetails: yards,
      })
      alertStore.info({ content: 'Work details saved!' })
    }
    catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  return {
    yards,
    getYards,
    addYard,
    removeYard,
    saveYards,
  }
})
