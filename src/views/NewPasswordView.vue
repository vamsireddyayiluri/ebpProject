<script setup>
import { getColor } from '~/helpers/colors'
import { useAuthStore } from '~/stores/auth.store'
import { auth } from '~/firebase'
import { confirmPasswordReset } from 'firebase/auth'
import { useAlertStore } from '~/stores/alert.store'
import { getUserIdByEmail } from "~/stores/helpers"

const form = reactive({
  password: '',
  confirmPassword: '',
})

const isPasswordVisible = ref(false)
const authStore = useAuthStore()
const alertStore = useAlertStore()
const router = useRouter()
const queryParams = router.currentRoute.value.query
const loading = ref(false)

const steps = {
  'new-password': {
    title: 'Enter your new password',
    isValid: () => form.password && form.confirmPassword && form.password === form.confirmPassword,
  },
  'reset-successfully': {
    title: 'Password reset successfully',
    isValid: () => true,
  },
}
const stepper = useStepper(steps)

const onSubmit = async () => {
  loading.value = true
  if (stepper.isCurrent('new-password')) {
    await resetPassword({ newPassword: form.password })
    loading.value = false
  }
  if (stepper.isLast.value) {
    await authStore.login({ email: queryParams.email, password: form.password })
    loading.value = false
  }
}

// updating password
const resetPassword = async ({ newPassword }) => {
  try {
    await confirmPasswordReset(auth, queryParams.actionCode, newPassword)
    const userId = await getUserIdByEmail(queryParams.email)
    await authStore.updateUserPassword({ userId , password: newPassword})
    alertStore.info({ content: 'Password updated succusfully' })
    stepper.goToNext()
  } catch ({ message }) {
    alertStore.warning({ content: message })
  }
}
</script>

<template>
  <Typography type="text-h1 mt-[140px]">
    {{ stepper.current.value.title }}
  </Typography>
  <form
    class="mx-auto max-w-[360px]"
    @submit.prevent="onSubmit"
  >
    <template v-if="stepper.isCurrent('new-password')">
      <Textfield
        v-model="form.password"
        label="Password"
        minlength="8"
        required
        class="mt-10"
        :type="isPasswordVisible ? 'text' : 'password'"
        :append-inner-icon="isPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
        @click:append-inner="isPasswordVisible = !isPasswordVisible"
      />
      <Textfield
        v-model="form.confirmPassword"
        type="password"
        label="Confirm password"
        minlength="8"
        required
        class="mt-4 mb-10"
      />
      <Button
        type="submit"
        :disabled="!stepper.current.value.isValid()"
        :loading="loading"
        class="w-full mx-auto"
      >
        Reset password
      </Button>
    </template>

    <template v-else>
      <Typography
        type="text-body-m-regular"
        :color="getColor('textSecondary')"
        class="mt-3 mb-10"
      >
        Your password has been successfully reset. Click below to log in into platform.
      </Typography>
      <Button
        type="submit"
        class="w-full mx-auto"
      >
        Log in
      </Button>
    </template>
  </form>
</template>
