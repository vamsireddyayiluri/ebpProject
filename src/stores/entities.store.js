import { defineStore } from 'pinia'
import { useAlertStore } from './alert.store'
import axios from 'axios'
import mockEntities from '~/fixtures/snapshots.json'

const alertStore = useAlertStore()

export const useEntitiesStore = defineStore('entities', () => {
  const loadEntities = async line => {
    const isDev = import.meta.env.MODE === 'development'
    const apiUrl = isDev ? '/api' : import.meta.env.VITE_APP_API_URL + '/snapshots/get'

    if (isDev) {
      try {
        const { data } = await axios.get(apiUrl, {
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

  const loadEmissions = async () => {
    try {
      const { data } = await axios.get(import.meta.env.VITE_APP_API_URL + '/external')

      return data
    } catch (error) {
      alertStore.warning({
        message: error,
        timeout: -1,
      })
    }
  }

  return { loadEmissions, loadEntities }
})
