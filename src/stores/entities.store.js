import { defineStore } from 'pinia'
import axios from 'axios'

import mockEntities from '~/fixtures/snapshots.json'

export const useEntitiesStore = defineStore({
  id: 'entities',
  state: () => ({
    error: null,
  }),
  actions: {
    async loadEntities(line) {
      if (import.meta.env.MODE === 'development') {
        return mockEntities
      } else {
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
          this.error = error
        }
      }
    },
  },
})
