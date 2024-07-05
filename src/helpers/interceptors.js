import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'

export default () => {
  const authStore = useAuthStore()
  axios.interceptors.request.use(
    async config => {
      const currentUser = authStore.currentUser
      if (currentUser) {
        config.headers.api_key = import.meta.env.VITE_APP_GLOBAL_API_KEY
      }

      return config
    },
    err => Promise.reject(err),
  )
}
