import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const isLogin = ref(false)
  const login = () => {
    setTimeout(() => {
      isLogin.value = true
      router.push({ name: 'login' })
    }, 500)
  }

  return { isLogin, login }
})
