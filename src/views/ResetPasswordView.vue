<script setup>
import { patterns } from '@qualle-admin/qutil'
import { getColor } from '~/helpers/colors'
import { useAlertStore } from '~/stores/alert.store'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '~/firebase'

const alertStore = useAlertStore()
const form = ref({
  email: '',
})

const steps = {
  'reset-pass': {
    title: 'Reset your password',
  },
  'check-email': {
    title: 'Check your email',
  },
}
const stepper = useStepper(steps)

const onSubmit = async () => {
  if (stepper.isCurrent('reset-pass')) {
    sendResetPasswordEmail({ email: form.value.email })
  }
  stepper.goToNext()
}
const resendLink = () => {
  sendResetPasswordEmail({ email: form.value.email })
}
const openMail = () => {
  console.log('openMail')
}

// Sending password reset verification email
const sendResetPasswordEmail = ({ email }) => {
  try {
    sendPasswordResetEmail(auth, email).then(() => {
      alertStore.info({ content: 'The link has been sent. Check your mailbox again, please.' })
    })
  } catch (error) {
    alertStore.warning({ content: error })
  }
}
</script>

<template>
  <Typography
    type="text-h1 mt-[140px]"
  >
    {{ stepper.current.value.title }}
  </Typography>
  <form
    class="mx-auto max-w-[360px]"
    @submit.prevent="onSubmit"
  >
    <template v-if="stepper.isCurrent('reset-pass')">
      <Textfield
        v-model="form.email"
        type="email"
        label="Email"
        required
        class="mt-10"
      />
      <Button
        type="submit"
        :disabled="!form.email.match(patterns.emailRegex)"
        class="w-full mt-10 mx-auto"
      >
        Send reset mail
      </Button>
    </template>

    <template v-if="stepper.isCurrent('check-email')">
      <Typography
        type="text-body-m-regular"
        :color="getColor('textSecondary')"
        class="mt-3 mb-10"
      >
        We sent a password reset link to <b>{{ form.email }}</b>
      </Typography>
      <Button
        type="submit"
        class="w-full mx-auto"
        @click="openMail"
      >
        Open mailbox
      </Button>
    </template>

    <VRow
      no-gutters
      class="flex justify-center items-center mt-4"
    >
      <Typography
        type="text-body-s-regular"
        :color="getColor('textSecondary')"
      >
        {{
          stepper.isCurrent('reset-pass') ? "Don't have an account?" : "Didn't receive the mail?"
        }}
      </Typography>
      <template v-if="stepper.isCurrent('reset-pass')">
        <RouterLink :to="{ name: 'register' }">
          <Typography
            type="text-body-s-semibold"
            class="p-0 ml-1"
            :color="getColor('textInteractive-01')"
          >
            Sign up
          </Typography>
        </RouterLink>
      </template>
      <template v-else>
        <Button
          variant="plain"
          class="pl-1"
          @click="resendLink"
        >
          Click to resend
        </Button>
      </template>
    </VRow>
  </form>
</template>

<style lang="scss">
</style>
