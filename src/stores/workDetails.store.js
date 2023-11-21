import { defineStore } from 'pinia'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAuthStore } from '~/stores/auth.store'
import { useAlertStore } from "~/stores/alert.store"

export const useWorkDetailsStore = defineStore('workDetails', () => {
  const alertStore = useAlertStore()

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
    saveYards,
  }
})
