import { defineStore } from 'pinia'
import { auth } from '~/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { useAlertStore } from '~/stores/alert.store'

const alertStore = useAlertStore()

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const user = ref(null)

  const login = async ({ email, password }) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)

      user.value = user

      router.push({ name: 'dashboard' })
    } catch (error) {
      switch (error.code) {
      case 'auth/user-not-found':
        alertStore.warning({ message: 'User not found' })
        break
      case 'auth/wrong-password':
        alertStore.warning({ message: 'Wrong password' })
        break
      default:
        alertStore.warning({ message: 'Something went wrong' })
      }
    }
  }

  const logout = async () => {
    await signOut(auth)

    user.value = null

    router.push({ name: 'login' })
  }

  const register = async ({ email, password }) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      user.value = user

      router.push({ name: 'dashboard' })
    } catch (error) {
      switch (error.code) {
      case 'auth/email-already-in-use':
        alertStore.warning({ message: 'Email already in use' })
        break
      case 'auth/invalid-email':
        alertStore.warning({ message: 'Invalid email' })
        break
      case 'auth/operation-not-allowed':
        alertStore.warning({ message: 'Operation not allowed' })
        break
      case 'auth/weak-password':
        alertStore.warning({ message: 'Weak password' })
        break
      default:
        alertStore.warning({ message: 'Something went wrong' })
      }
    }
  }

  return { login, logout, register, user }
})
