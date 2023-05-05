import { defineStore } from 'pinia'
import { auth } from '~/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { useAlertStore } from '~/stores/alert.store'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const alertStore = useAlertStore()
  const currentUser = ref(null)

  const login = async ({ email, password }) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)

      currentUser.value = user

      // router.push({ name: 'dashboard' })
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

    currentUser.value = null

    router.push({ name: 'login' })
  }

  const register = async ({ email, password }) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      currentUser.value = user

      // router.push({ name: 'dashboard' })
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

  const getUser = () => {
    auth.onAuthStateChanged(async user => {
      if (user === null) {
        currentUser.value = null
      } else {
        currentUser.value = user

        if (router.currentRoute.value.name === 'login') {
          // router.push({ name: 'dashboard' })
        }
      }
    })
  }

  return { login, logout, register, currentUser, getUser }
})
