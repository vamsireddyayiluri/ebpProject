<script setup>
import { useAuthStore } from '~/stores/auth.store'
import { auth } from '~/firebase'
import { useAlertStore } from '~/stores/alert.store'
import { applyActionCode, verifyPasswordResetCode } from 'firebase/auth'
const authStore = useAuthStore()
const alertStore = useAlertStore()
const router = useRouter()
const createPassPage = ref(null)
const loading = ref(true)

onMounted(async () => {
  await validateUserEmail()
  loading.value = false
})
const validateUserEmail = async () => {
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
    await handleResetPassword(actionCode)
    break
  case 'recoverEmail':
    // Display email recovery handler and UI.
    await handleRecoverEmail(auth, actionCode, lang)
    break
  case 'verifyEmail':
    // Display email verification handler and UI.
    await handleVerifyEmail(actionCode, email)
    break
  case 'signIn':
    createPassPage.value = true
    break
  default:

    // Error: invalid mode.
  }
}
const handleVerifyEmail = async (actionCode, email) => {
  try {
    await applyActionCode(auth, actionCode)
    const verificationData = await authStore.getVerificationData(email)
    await authStore.registerCompleteAction(verificationData)
  } catch ({ code, message }) {
    if (code === 'auth/invalid-action-code') {
      await authStore.removeUserFromPendingVerification(verificationData[0].id)
      router.push({ name: 'verify1' })
    } else {
      alertStore.warning({ message })
    }
  }
}

const handleRecoverEmail = async (auth, actionCode, lang) => {
  console.log('handle recovery email')
}

const handleResetPassword = async actionCode => {
  try {
    const email = await verifyPasswordResetCode(auth, actionCode)
    router.push({ name: 'new-password', query: { email, actionCode } })
  } catch ({ message }) {
    alertStore.warning({ content: message })
  }
}
</script>

<template>
  <Loader :loading="loading" :step="2" :interval="150" text="Preparing Workspace..." />
  <CreateInvitedUserView v-if="createPassPage" />
</template>
