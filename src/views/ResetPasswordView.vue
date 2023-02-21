<script setup>
import { patterns } from '@qualle-admin/qutil'
import { getColor } from '@/helpers/colors.js'
import { useAlertStore } from '@/stores/alert.store'

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

const onSubmit = () => {
  console.log('send ', form.value)
  stepper.goToNext()
}
const resendLink = () => {
  alertStore.info({
    message: 'The link has been resent. Check your mailbox again, please.',
    timeout: true,
  })
  console.log('resendLink')
}
const openMail = () => {
  console.log('openMail')
}
</script>

<template>
  <Typography type="text-h1" :style="{ marginTop: '140px' }">
    {{ stepper.current.value.title }}
  </Typography>
  <form
    class="mx-auto"
    @submit.prevent="onSubmit"
    :style="{ maxWidth: '360px' }"
  >
    <template v-if="stepper.isCurrent('reset-pass')">
      <Textfield
        type="email"
        v-model="form.email"
        label="Email"
        required
        class="mt-10"
      />
      <Button
        type="submit"
        :disabled="!form.email.match(patterns.emailRegex)"
        class="w-100 mt-10 mx-auto"
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
      <Button type="submit" class="w-100 mx-auto" @click="openMail"
        >Open mailbox</Button
      >
    </template>

    <VRow no-gutters class="d-flex justify-center align-center mt-4">
      <Typography
        type="text-body-s-regular"
        :style="{ color: getColor('textSecondary') }"
      >
        {{
          stepper.isCurrent('reset-pass')
            ? "Don't have an account?"
            : "Didn't receive the mail?"
        }}
      </Typography>
      <template v-if="stepper.isCurrent('reset-pass')">
        <RouterLink :to="{ name: 'register' }">
          <Typography
            type="text-body-s-semibold"
            class="pa-0 ml-1"
            :color="getColor('textInteractive-01')"
          >
            Sign up
          </Typography>
        </RouterLink>
      </template>
      <template v-else>
        <Button variant="plain" class="pl-1" @click="resendLink">
          Click to resend
        </Button>
      </template>
    </VRow>
  </form>
</template>

<style lang="scss">
@use '@core/scss/pages/page-auth.scss';
</style>
