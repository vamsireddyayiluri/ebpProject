<script setup>
import PasswordMeter from 'vue-simple-password-meter'
import { patterns } from '@qualle-admin/qutil'
import Stepper from '@/views/pages/authentication/Stepper.vue'
import { getColor } from '@/helpers/colors.js'

const form = reactive({
  companyName: '',
  email: '',
  password: '',
  confirmPassword: '',
  memberEmail: '',
  address: '',
  locationLabel: '',
})
const isPasswordVisible = ref(false)
const memberType = ref(['Member', 'Admin'])
const members = ref([
  { id: '1', value: '1 tim.jennings@example.com' },
  { id: '2', value: '2 tim.jennings@example.com', workerId: 'Worker ID: 1234' },
])
const dialog3 = ref(null)
const newMemberEmail = ref(null)
const newMemberType = ref(memberType.value[0])
console.log('=>(register.vue:24) newMemberEmail', newMemberEmail)
const steps = {
  /*'account-information': {
    title: 'Account information',
    isValid: () =>
      form.companyName &&
      form.email.match(patterns.emailRegex) &&
      form.password &&
      form.confirmPassword &&
      form.password === form.confirmPassword,
  },*/
  'invite-team-members': {
    title: 'Invite team members',
    isValid: () => form.memberEmail?.trim() !== '',
  },
  'add-container-yards': {
    title: 'Add container yards',
    isValid: () => form.address && form.locationLabel,
  },
}
const stepper = useStepper(steps)
const onSubmit = () => {
  if (stepper.current.value.isValid()) stepper.goToNext()
}
const goToStep = (stepId) => {
  if (stepper.isFirst.value) {
    if (stepper.current.value.isValid()) stepper.goTo(stepId)
  } else stepper.goTo(stepId)
}
const addMember = () => {
  console.log('add member', newMemberEmail.value, newMemberType.value)
}
const onRemove = (memberId) => {
  members.value = members.value.filter((m) => m.id !== memberId)
}
const onSelectMemberType = (e) => {
  newMemberType.value = e
  console.log(e)
}
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4" />

  <Stepper
    :steps="stepper.steps.value"
    :activeStep="stepper.index"
    @goTo="goToStep"
    :style="{ maxWidth: '540px' }"
  />
  <div>
    <form class="mt-16" @submit.prevent="onSubmit">
      <div class="mb-10">
        <Typography type="text-h1">
          {{ stepper.current.value.title }}
        </Typography>
      </div>
      <div>
        <VContainer class="pa-0" :style="{ maxWidth: '620px' }">
          <template v-if="stepper.isCurrent('account-information')">
            <VRow no-gutters class="mb-4">
              <VCol class="mr-4">
                <Textfield
                  type="text"
                  v-model="form.companyName"
                  label="Company name"
                />
              </VCol>
              <VCol>
                <Textfield type="email" v-model="form.email" label="Email" />
              </VCol>
            </VRow>
            <VResponsive width="100%" />
            <VRow no-gutters>
              <VCol class="mr-4">
                <Textfield
                  v-model="form.password"
                  label="Password"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="
                    isPasswordVisible
                      ? 'mdi-eye-off-outline'
                      : 'mdi-eye-outline'
                  "
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
                <password-meter :password="form.password" />
              </VCol>
              <VCol>
                <Textfield
                  type="password"
                  v-model="form.confirmPassword"
                  label="Confirm password"
                />
              </VCol>
            </VRow>
          </template>

          <template v-if="stepper.isCurrent('invite-team-members')">
            <!--            <input v-model="form.billingAddress" type="text" />-->
            <!--            <Button @click="dialog3.show(true)">add</Button>-->
            <div class="d-flex">
              <TextFieldWithSelector
                label="Email"
                :items="memberType"
                itemTitle="label"
                itemValue="id"
                returnObject="true"
                v-model="newMemberEmail"
                @onSelect="onSelectMemberType"
              />
              <Button variant="outlined" @click="addMember">
                Add member
              </Button>
            </div>

            <MemberItems
              :members="members"
              :memberType="memberType"
              @onRemove="onRemove"
              @onSelect="onSelectMemberType"
            />
          </template>

          <div v-if="stepper.isCurrent('add-container-yards')">
            <div>
              <input
                id="carbon-offsetting"
                v-model="form.carbonOffsetting"
                type="checkbox"
                class="mr-2"
              />
              <label for="carbon-offsetting">
                I accept to deposit a carbon offsetting fee
              </label>
            </div>
            <div>
              <input
                id="contract"
                v-model="form.contractAccepted"
                type="checkbox"
                class="mr-2"
              />
              <label for="contract">I accept the terms of the contract</label>
            </div>
          </div>
        </VContainer>

        <div>
          <Button
            v-if="!stepper.isLast.value"
            :disabled="!stepper.current.value.isValid()"
            type="submit"
            class="button mt-10"
            @submit.prevent="submit"
          >
            Next
          </Button>
          <Button
            v-if="stepper.isLast.value"
            :disabled="!stepper.current.value.isValid()"
          >
            Submit
          </Button>

          <div
            v-if="stepper.isFirst.value"
            class="d-flex justify-center align-center mt-4"
          >
            <Typography
              type="text-body-s-regular"
              :style="{ color: getColor('textSecondary') }"
            >
              Already have an account?
            </Typography>
            <RouterLink :to="'/login'">
              <Typography
                type="text-body-s-semibold"
                class="pa-0 ml-1"
                :style="{ color: getColor('textInteractive-01') }"
              >
                Log in
              </Typography>
              <!--              <Button variant="plain" class="pa-0 ml-1"> Log in </Button>-->
            </RouterLink>
          </div>
        </div>
      </div>
    </form>

    <div class="flex flex-col gap-4 mt-12">
      <div
        class="w-full px-4 py-2 rounded border border-main space-y-2 overflow-auto h-full"
      >
        <span class="font-bold">Form</span>
        <pre v-text="form" />
      </div>

      <div
        class="w-full px-4 py-2 rounded border border-main space-y-2 overflow-auto h-full"
      >
        <span class="font-bold">Wizard</span>
        <pre v-text="stepper" />
      </div>
    </div>
  </div>

  <RemoveMemberDialog :dialog3="dialog3" />
</template>

<style lang="scss">
@use '@core/scss/pages/page-auth.scss';

.button {
  max-width: 360px;
  width: 100%;
}
.styledTextFieldWithSelector {
  width: -webkit-fill-available;
}
/*.wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}*/
</style>

<route lang="yaml">
meta:
  layout: auth
</route>
