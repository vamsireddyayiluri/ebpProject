<script setup>
import { useAuthStore } from '~/stores/auth.store'
import { auth } from '~/firebase'
import { useAlertStore } from '~/stores/alert.store'
import { applyActionCode, verifyPasswordResetCode } from 'firebase/auth'
const authStore = useAuthStore()
const alertStore = useAlertStore()
const router = useRouter()
const actionCode = null

onMounted(() => {
  validateUserEmail()
})
const validateUserEmail = () => {
  const queryParams = router.currentRoute.value.query

  // Get the action to complete.
  const mode = queryParams.mode

  // Get the one-time code from the query parameter.
  const actionCode = queryParams.oobCode

  // (Optional) Get the continue URL from the query parameter if available.
  const continueUrl = queryParams.continueUrl

  // (Optional) Get the language code if available.
  const lang = queryParams.lang || 'en'

  const email = queryParams.email

  // Handle the user management action.
  switch (mode) {
  case 'resetPassword':
    // Display reset password handler and UI.
    handleResetPassword(actionCode, continueUrl, lang)
    break
  case 'recoverEmail':
    // Display email recovery handler and UI.
    handleRecoverEmail(auth, actionCode, lang)
    break
  case 'verifyEmail':
    // Display email verification handler and UI.
    handleVerifyEmail(actionCode, continueUrl, lang, email)
    break
  default:

    // Error: invalid mode.
  }
}
const handleVerifyEmail = async (actionCode, continueUrl, lang, email) => {
  try {
    await applyActionCode(auth, actionCode)
    const verificationData = await authStore.getVerificationData(email)
    authStore.registerCompleteAction(verificationData)
  } catch ({ code, message }) {
    if (code === 'auth/invalid-action-code') {
      router.push({ name: 'verify1' })
    } else {
      alertStore.warning({ message })
    }
  }
}

const handleRecoverEmail = async (auth, actionCode, lang) => {
  console.log('handle recovery email')
}

const handleResetPassword = async (actionCode, continueUrl, lang) => {
  try {
    const email = await verifyPasswordResetCode(auth, actionCode)
    router.push({ name: 'new-password', query: { email, actionCode } })
  } catch ({ message }) {
    alertStore.warning({ content: message })
  }
}
</script>
