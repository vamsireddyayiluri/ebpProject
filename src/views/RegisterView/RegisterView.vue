<script setup>
import PasswordMeter from 'vue-simple-password-meter'
import Stepper from '~/components/Stepper/Stepper.vue'
import { getColor } from '~/helpers/colors'
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from 'pinia'
import { patterns } from '@qualle-admin/qutil'
import { emailRegex } from '@qualle-admin/qutil/dist/patterns'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { useTruckerManagementStore } from '~/stores/truckerManagement.store'
import listRequiresForTruckers from '~/fixtures/requiresForTruckers.json'
import { usePreferredTruckersStore } from '~/stores/preferredTruckers.store'
import { vMaska, Mask } from 'maska'
import { cellMask } from '~/helpers/mask'

const authStore = useAuthStore()
const workDetailsStore = useWorkDetailsStore()
const truckerManagement = useTruckerManagementStore()

const form = reactive({
  fullName: '',
  email: '',
  companyName: '',
  cell: '',
  password: '',
  confirmPassword: '',
})
const loading = ref(false)
const { yards, vendorDetails } = storeToRefs(workDetailsStore)
const { requiresForTruckers, questionList, onboardingDocuments } = storeToRefs(truckerManagement)
const { getVendorDetails } = useWorkDetailsStore()
const preferredTruckersStore = usePreferredTruckersStore()
const invitations = ref([])
const unMaskedCell = ref({})
const options = { mask: cellMask }

const rules = {
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
      unMaskedCell.value?.completed &&
      form.password &&
      form.confirmPassword &&
      form.password === form.confirmPassword,
  },
  'work-details': {
    title: 'Yard details',
    isValid: () => true,
  },
  'invite-members': {
    title: 'Invite team members',
    isValid: () => true,
  },
  'trucker-requirements': {
    title: 'Trucker requirements',
    isValid: () => true,
  },
  'required-onboarding-documents': {
    title: 'Required onboarding documents',
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
    loading.value = true
    await authStore.register({
      form: { ...form, cell: unMaskedCell.value.unmasked },
      cell: unMaskedCell.value.unmasked,
      yards: yards.value,
      vendorDetails: vendorDetails.value,
      invitations: invitations.value,
      requiresForTruckers: requiresForTruckers.value,
      questionList: questionList.value,
      onboardingDocuments: onboardingDocuments.value,
      preferredTruckers: preferredTruckersStore.preferredTruckers,
    })
    loading.value = false
  }
  if (stepper.current.value.isValid()) {
    stepper.goToNext()
  }
}
onMounted(async () => {
  workDetailsStore.yards = []
  truckerManagement.requiresForTruckers = JSON.parse(JSON.stringify(listRequiresForTruckers))
  truckerManagement.questionList = []
  truckerManagement.onboardingDocuments = []
  getVendorDetails()
})
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
              v-maska:[options]="unMaskedCell"
              type="tel"
              label="Work phone *"
              :error-messages="
                form.cell ? unMaskedCell.completed || 'Invalid phone number format' : true
              "
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
          <Yards class="mx-auto" />
        </template>
        <div>
          <template v-if="stepper.isCurrent('invite-members')">
            <TeamMembers :team-members="invitations" />
          </template>
        </div>
        <template v-if="stepper.isCurrent('trucker-requirements')">
          <TruckerRequirements />
        </template>
        <template v-if="stepper.isCurrent('required-onboarding-documents')">
          <FileUpload />
        </template>
      </div>
      <div class="mt-10 mx-auto">
        <Button
          v-show="!stepper.isFirst.value"
          variant="outlined"
          class="max-w-[360px] sm:max-w-[220px] w-full mr-0 sm:!mr-5 mb-5 sm:!mb-0"
          @click="goToStep(stepper.stepNames.value[stepper.index.value - 1])"
        >
          Back
        </Button>
        <Button
          v-if="!stepper.isLast.value"
          :disabled="!stepper.current.value.isValid()"
          type="submit"
          :class="
            stepper.isFirst.value ? 'max-w-[360px] w-full' : 'max-w-[360px] sm:max-w-[220px] w-full'
          "
        >
          Next
        </Button>
        <Button
          v-if="stepper.isLast.value"
          :disabled="!stepper.current.value.isValid()"
          type="submit"
          :loading="loading"
          class="max-w-[220px] w-full"
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
