import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const isLogin = ref(false)
  const login = () => {
    setTimeout(() => {
      isLogin.value = true
      router.push({ name: 'dashboard' })
    }, 500)
  }

  return { isLogin, login }
})
