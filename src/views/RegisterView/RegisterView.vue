<script setup>
import PasswordMeter from 'vue-simple-password-meter'
import Stepper from '~/components/Stepper/Stepper.vue'
import { getColor } from '~/helpers/colors'
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from 'pinia'
import { patterns } from '@qualle-admin/qutil'
import { phoneRegex, emailRegex } from '@qualle-admin/qutil/dist/patterns'

const authStore = useAuthStore()
const { isLoading } = storeToRefs(authStore)

const form = reactive({
  fullName: '',
  email: '',
  companyName: '',
  cell: '',
  password: '',
  confirmPassword: '',
})
const rules = {
  cell(value) {
    return phoneRegex.test(value) || 'Invalid phone number format'
  },
  email(value) {
    return emailRegex.test(value) || 'Invalid e-mail'
  },
}
const steps = {
  'account-information': {
    title: 'Account information',
    isValid: () =>
      form.fullName?.trim() !== '' &&
      form.email.match(patterns.emailRegex) &&
      form.companyName?.trim() !== '' &&
      form.cell.match(patterns.phoneRegex) &&
      form.password &&
      form.confirmPassword &&
      form.password === form.confirmPassword,
  },
  'work-details': {
    title: 'Work details',
    isValid: () => true,
  },
  'invite-members': {
    title: 'Invite team members',
    isValid: () => true,
  },
  'required-onboarding-documents': {
    title: 'Required onboarding documents',
    isValid: () => true,
  },
  'trucker-requirements': {
    title: 'Trucker requirements',
    isValid: () => true,
  },
}
const stepper = useStepper(steps)

const isPasswordVisible = ref(false)

const goToStep = stepId => {
  if (stepper.isFirst.value) {
    if (stepper.current.value.isValid()) stepper.goTo(stepId)
  } else stepper.goTo(stepId)
}

const onSubmit = async () => {
  if (stepper.isLast.value) {
    await authStore.register({ form })
  }
  if (stepper.current.value.isValid()) {
    stepper.goToNext()
  }
}
</script>

<template>
  <Stepper
    :steps="stepper.steps.value"
    :active-step="stepper.index"
    class="mt-10"
    :style="{ maxWidth: '940px' }"
    @goTo="goToStep"
  />
  <form
    class="mt-16"
    @submit.prevent="onSubmit"
  >
    <Typography type="text-h1 mb-10">
      {{ stepper.current.value.title }}
    </Typography>
    <div>
      <div class="p-0 mx-auto mt-10 max-w-[730px]">
        <template v-if="stepper.isCurrent('account-information')">
          <div
            class="max-w-[730px] mx-auto mt-10 grid sm:grid-cols-2 grid-cols-1 gap-4 text-left [&>div]:h-fit"
          >
            <Textfield
              v-model.trim="form.fullName"
              type="text"
              label="Full name *"
              required
            />
            <Textfield
              v-model.trim="form.email"
              type="email"
              label="Email *"
              :rules="[rules.email]"
              required
            />
            <Textfield
              v-model.trim="form.companyName"
              type="text"
              label="Company name *"
              required
            />
            <Textfield
              v-model.trim="form.cell"
              type="tel"
              label="Work phone *"
              :rules="[rules.cell]"
              required
            />
            <div>
              <Textfield
                v-model="form.password"
                label="Password *"
                minlength="8"
                required
                :type="isPasswordVisible ? 'text' : 'password'"
                :append-inner-icon="isPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />
              <PasswordMeter :password="form.password" />
            </div>
            <Textfield
              v-model="form.confirmPassword"
              type="password"
              label="Confirm password *"
              minlength="8"
              required
              class="h-12"
            />
          </div>
        </template>
        <template v-if="stepper.isCurrent('work-details')">
          <Yards />
        </template>
        <template v-if="stepper.isCurrent('invite-members')">
          <TeamMembers />
        </template>
        <template v-if="stepper.isCurrent('required-onboarding-documents')">
          <FileUpload />
        </template>
        <template v-if="stepper.isCurrent('trucker-requirements')">
          <TruckerRequirements />
        </template>
      </div>
      <div class="mt-10 mx-auto">
        <Button
          v-if="!stepper.isLast.value"
          :disabled="!stepper.current.value.isValid()"
          type="submit"
          class="max-w-[360px] w-full"
        >
          Next
        </Button>
        <Button
          v-if="stepper.isLast.value"
          :disabled="!stepper.current.value.isValid()"
          type="submit"
          class="max-w-[360px] w-full"
        >
          Create workspace
        </Button>

        <div
          v-if="stepper.isFirst.value"
          class="flex justify-center items-center mt-4"
        >
          <Typography
            type="text-body-s-regular"
            :color="getColor('textSecondary')"
          >
            Already have an account?
          </Typography>
          <RouterLink :to="{ name: 'login' }">
            <Typography
              type="text-body-s-semibold"
              class="p-0 ml-1"
              :color="getColor('textInteractive-01')"
            >
              Log in
            </Typography>
          </RouterLink>
        </div>
      </div>
    </div>
  </form>
</template>
