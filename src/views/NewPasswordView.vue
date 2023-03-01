<script setup>
import { getColor } from '~/helpers/colors'
import { useAuthStore } from '~/stores/auth.store'
const form = reactive({
  password: '',
  confirmPassword: '',
})

const isPasswordVisible = ref(false)
const authStore = useAuthStore()

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

const onSubmit = () => {
  if (stepper.isLast.value) {
    authStore.login()

    return
  }
  console.log('send ', form)
  stepper.goToNext()
}
</script>

<template>
  <Typography
    type="text-h1"
    :style="{ marginTop: '140px' }"
  >
    {{ stepper.current.value.title }}
  </Typography>
  <form
    class="mx-auto"
    :style="{ maxWidth: '360px' }"
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
        class="w-100 mx-auto"
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
        class="w-100 mx-auto"
      >
        Log in
      </Button>
    </template>
  </form>
</template>

<style lang="scss">
@use '@core/scss/pages/page-auth.scss';
</style>
