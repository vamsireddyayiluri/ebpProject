<script setup>
import PasswordMeter from 'vue-simple-password-meter'
import { patterns } from '@qualle-admin/qutil'
import Stepper from '@/components/Stepper/Stepper.vue'
import { getColor } from '@/helpers/colors.js'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const form = reactive({
  companyName: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const isPasswordVisible = ref(false)
const memberType = ref(['Member', 'Admin'])
const members = ref([])
const locations = ref([])
const memberDialog = ref(null)
const locationDialog = ref(null)
const newMember = reactive({
  email: '',
  type: memberType.value[0],
})

const newLocation = ref({
  address: null,
  label: '',
})

const removedMember = ref(null)
const removedLocation = ref(null)
const selectItems = [
  { id: 10, label: 'Menu item #1' },
  { id: 1, label: 'Menu item #2' },
  { id: 2, label: 'Menu item #3' },
  { id: 3, label: 'Menu item #4' },
  { id: 4, label: 'Menu item #5' },
]
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

const goToStep = (stepId) => {
  if (stepper.isFirst.value) {
    if (stepper.current.value.isValid()) stepper.goTo(stepId)
  } else stepper.goTo(stepId)
}
const addMember = () => {
  members.value.push({ id: newMember.email, value: newMember.email })
  newMember.email = ''
}
const openRemoveMemberDialog = (memberId) => {
  memberDialog.value.show(true)
  removedMember.value = members.value.find((m) => m.id === memberId)
}
const removeMember = (memberId) => {
  members.value = members.value.filter((m) => m.id !== memberId)
  memberDialog.value.show(false)
}
const onSelectMemberType = (type) => {
  console.log('1', type)
  newMember.type = type
}
const onChangeMemberType = (e) => {
  console.log('=>(RegisterView.vue:86) e', e)
}
const addContainer = () => {
  locations.value.push({
    id: newLocation.value.address.id,
    value: newLocation.value.address.label,
    label: newLocation.value.label,
  })
  newLocation.value.address = null
  newLocation.value.label = ''
}
const openRemoveLocationDialog = (locationId) => {
  locationDialog.value.show(true)
  removedLocation.value = locations.value.find((l) => l.id === locationId)
}
const removeLocation = (locationId) => {
  locations.value = locations.value.filter((l) => l.id !== locationId)
  locationDialog.value.show(false)
}
const onSubmit = () => {
  if (stepper.current.value.isValid()) {
    stepper.goToNext()
    return
  }
  if (stepper.isLast.value) {
    authStore.login()
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
    :activeStep="stepper.index"
    @goTo="goToStep"
    class="mt-10"
    :style="{ maxWidth: '540px' }"
  />
  <form class="mt-16" @submit.prevent="onSubmit">
    <Typography type="text-h1">
      {{ stepper.current.value.title }}
    </Typography>
    <div>
      <VContainer class="pa-0" :style="{ maxWidth: '730px' }">
        <template v-if="stepper.isCurrent('account-information')">
          <VRow no-gutters class="mt-10">
            <VCol cols="12" sm="6">
              <Textfield
                type="text"
                v-model="form.companyName"
                label="Company name"
                required
                class="mx-2 mb-4"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <Textfield
                type="email"
                v-model="form.email"
                label="Email"
                required
                class="mx-2 mb-4"
              />
            </VCol>
          </VRow>
          <VResponsive width="100%" />
          <VRow no-gutters>
            <VCol cols="12" sm="6">
              <Textfield
                v-model="form.password"
                label="Password"
                minlength="8"
                required
                class="mx-2 mb-3"
                :type="isPasswordVisible ? 'text' : 'password'"
                :append-inner-icon="
                  isPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
                "
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />
              <password-meter :password="form.password" />
            </VCol>
            <VCol cols="12" sm="6">
              <Textfield
                type="password"
                v-model="form.confirmPassword"
                label="Confirm password"
                minlength="8"
                required
                class="mx-2"
              />
            </VCol>
          </VRow>
        </template>

        <template v-if="stepper.isCurrent('invite-team-members')">
          <VRow no-gutters class="mt-10 d-flex">
            <VCol class="w-100 text-left mr-4" cols="12" sm="">
              <TextFieldWithSelector
                type="email"
                label="Email"
                :items="memberType"
                itemTitle="label"
                itemValue="id"
                returnObject="true"
                v-model="newMember.email"
                @onSelect="onSelectMemberType"
              />
            </VCol>
            <Button
              variant="outlined"
              type="submit"
              @click.prevent="addMember"
              :disabled="!newMember.email.match(patterns.emailRegex)"
              class="mt-4 mt-sm-0 mx-auto"
            >
              Add member
            </Button>
          </VRow>

          <MemberItems
            :members="members"
            is-select
            :selector-data="memberType"
            @onRemove="openRemoveMemberDialog"
            @onSelect="onChangeMemberType"
          />
        </template>

        <template v-if="stepper.isCurrent('add-container-yards')">
          <Typography
            type="text-body-m-regular"
            :style="{ color: getColor('textSecondary') }"
            class="mt-3"
          >
            Add the locations that manage or is partnered with
          </Typography>
          <VRow no-gutters class="mt-10">
            <VCol cols="12" sm="5">
              <Autocomplete
                v-model="newLocation.address"
                :items="selectItems"
                label="Address"
                hint="For e.g. 2972 Westheimer Santa Ana, Illinois"
                persistent-hint
                itemTitle="label"
                itemValue="id"
                returnObject
                prepend-icon="mdi-map"
                class="text-left"
              />
            </VCol>
            <VCol cols="12" sm="">
              <Textfield
                type="text"
                v-model="newLocation.label"
                label="Location label"
                hint="For e.g. Farm label"
                persistent-hint
                class="mx-0 mx-sm-4 mt-4 mt-sm-0 text-left"
              />
            </VCol>
            <Button
              variant="outlined"
              type="submit"
              @click.prevent="addContainer"
              :disabled="!newLocation.address || !newLocation.label"
              class="mt-4 mt-sm-0 mx-auto"
            >
              Add
            </Button>
          </VRow>
          <VRow no-gutters>
            <LocationItems
              :locations="locations"
              isCloseBtn
              @onRemove="openRemoveLocationDialog"
              :style="{ width: '100%' }"
            />
          </VRow>
        </template>
      </VContainer>

      <div class="mt-10 mx-auto">
        <Button
          v-if="!stepper.isLast.value"
          :disabled="!stepper.current.value.isValid()"
          type="submit"
          class="button"
        >
          Next
        </Button>
        <Button v-if="stepper.isLast.value" type="submit" class="button">
          Create workspace
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
          <RouterLink :to="{ name: 'login' }">
            <Typography
              type="text-body-s-semibold"
              class="pa-0 ml-1"
              :style="{ color: getColor('textInteractive-01') }"
            >
              Log in
            </Typography>
          </RouterLink>
        </div>
      </div>
    </div>
  </form>

  <template>
    <Dialog ref="memberDialog" width="50%" minWidth="400px">
      <template #text>
        <div class="pa-0">
          Are you sure you want to remove
          <Typography type="text-body-m-semibold" class="d-inline">
            Member {{ removedMember.value }}
          </Typography>
          from the team?
        </div>
      </template>
      <template #actions>
        <Button block variant="plain" @click="removeMember(removedMember.id)">
          Remove
        </Button>
      </template>
    </Dialog>
  </template>

  <template>
    <Dialog ref="locationDialog" width="50%" minWidth="400px">
      <template #text>
        <div class="pa-0">
          Are you sure you want to remove Good location
          <Typography type="text-body-m-semibold" class="d-inline">
            {{ removedLocation.value }}
          </Typography>
          from your locations?
        </div>
      </template>
      <template #actions>
        <Button
          block
          variant="plain"
          @click="removeLocation(removedLocation.id)"
        >
          Remove
        </Button>
      </template>
    </Dialog>
  </template>
</template>

<style lang="scss">
@use '@core/scss/pages/page-auth.scss';

.button {
  max-width: 360px !important;
  width: 100%;
}
.styledTextFieldWithSelector {
  width: -webkit-fill-available;
}
.styleLocationItems {
  width: 100%;
}
</style>
