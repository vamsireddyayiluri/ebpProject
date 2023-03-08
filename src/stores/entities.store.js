import { defineStore } from 'pinia'
import { useAlertStore } from './alert.store'
import axios from 'axios'
import mockEntities from '~/fixtures/snapshots.json'

const alertStore = useAlertStore()

export const useEntitiesStore = defineStore('entities', () => {
  const error = ref(null)

  const loadEntities = async line => {
    if (import.meta.env.MODE === 'development') {
      try {
        const { data } = await axios.get('/api', {
          headers: {
            api_key: import.meta.env.VITE_APP_API_KEY,
          },
          params: {
            line,
          },
        })

        return data
      } catch (error) {
        alertStore.warning({
          message: error,
          timeout: -1,
        })
      }
    } else {
      return mockEntities
    }
  }

  return { error, loadEntities }
})
