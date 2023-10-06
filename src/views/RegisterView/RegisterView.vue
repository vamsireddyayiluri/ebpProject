<script setup>
import PasswordMeter from 'vue-simple-password-meter'
import { patterns } from '@qualle-admin/qutil'
import Stepper from '~/components/Stepper/Stepper.vue'
import { getColor } from '~/helpers/colors'
import { useAuthStore } from '~/stores/auth.store'

const authStore = useAuthStore()
const form = reactive({
  companyName: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const isPasswordVisible = ref(false)

const steps = {
  'account-information': {
    title: 'Account information',
    isValid: () =>
      form.companyName?.trim() !== '' &&
      form.email.match(patterns.emailRegex) &&
      form.password &&
      form.confirmPassword &&
      form.password === form.confirmPassword,
  },
}
const stepper = useStepper(steps)

const goToStep = stepId => {
  if (stepper.isFirst.value) {
    if (stepper.current.value.isValid()) stepper.goTo(stepId)
  } else stepper.goTo(stepId)
}

const onSubmit = async () => {
  if (stepper.current.value.isValid()) {
    stepper.goToNext()

    return
  }
  if (stepper.isLast.value) {
    await authStore.register({ email: form.email, password: form.password })

    console.log('send', {
      ...form,
      members: members.value,
      location: locations.value,
    })
  }
}
</script>

<template>
  <Stepper
    :steps="stepper.steps.value"
    :active-step="stepper.index"
    class="mt-10"
    :style="{ maxWidth: '540px' }"
    @goTo="goToStep"
  />
  <form
    class="mt-16"
    @submit.prevent="onSubmit"
  >
    <Typography class="text-9xl">
      {{ stepper.current.value.title }}
    </Typography>
    <div>
      <div
        class="p-0 mx-auto max-w-[730px]"
      >
        <template v-if="stepper.isCurrent('account-information')">
          <VRow
            no-gutters
            class="mt-10 mb-4"
          >
            <VCol
              cols="12"
              sm="6"
            >
              <Textfield
                v-model.trim="form.companyName"
                type="text"
                label="Company name"
                required
                class="mx-2 mb-4"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <Textfield
                v-model.trim="form.email"
                type="email"
                label="Email"
                required
                class="mx-2 mb-4"
              />
            </VCol>
          </VRow>
          <VResponsive width="100%" />
          <VRow no-gutters>
            <VCol
              cols="12"
              sm="6"
            >
              <Textfield
                v-model="form.password"
                label="Password"
                minlength="8"
                required
                class="mx-2 mb-3"
                :type="isPasswordVisible ? 'text' : 'password'"
                :append-inner-icon="isPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />
              <PasswordMeter :password="form.password" />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <Textfield
                v-model="form.confirmPassword"
                type="password"
                label="Confirm password"
                minlength="8"
                required
                class="mx-2"
              />
            </VCol>
          </VRow>
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

  <Dialog
    ref="memberDialog"
    width="50%"
    min-width="400px"
  >
    <template #text>
      <RemoveTeamMemberDialog
        :removed-member="removedMember"
        @onRemove="removeMember"
      />
    </template>
  </Dialog>

  <Dialog
    ref="locationDialog"
    width="50%"
    min-width="400px"
  >
    <template #text>
      <RemoveLocationDialog
        :removed-location="removedLocation"
        @onRemove="removeLocation"
      />
    </template>
  </Dialog>
</template>

<style lang="scss">
</style>
