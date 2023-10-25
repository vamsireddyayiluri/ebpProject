<script setup>
import { Main } from '@layouts'
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from 'pinia'
import { useDate } from '~/composables'
import { emailRegex, phoneRegex } from '@qualle-admin/qutil/dist/patterns'

const authStore = useAuthStore()
const { currentUser, userData } = storeToRefs(authStore)
const formatDate = useDate()
const accountInfo = ref({
  firstName: userData.value.firstName,
  lastName: userData.value.lastName,
  company: userData.value.company || 'Exporter company',
  phone: userData.value.cell,
  email: currentUser.value.email,
  password: userData.value.password,
  passwordLastChanges:
    'Last change ' + formatDate(currentUser.value.reloadUserInfo.passwordUpdatedAt),
  imageUrl: currentUser.value.photoURL,
})
const isPasswordVisible = ref(false)
const router = useRouter()

const rules = {
  email(value) {
    return emailRegex.test(value) || 'Invalid e-mail'
  },
  phone(value) {
    return phoneRegex.test(value) || 'Invalid phone number'
  },
  password(value) {
    return value > 8 || 'Min length 8'
  },
}
const addUserAvatar = async (_, file) => {
  await authStore.updateUserAvatar(file)
}
const validateName = computed(() => {
  return (
    accountInfo.value.firstName !== userData.value.firstName ||
    accountInfo.value.lastName !== userData.value.lastName
  )
})
const validateEmail = computed(() => {
  return accountInfo.value.email !== userData.value.email
})

const onSave = async () => {
  const userId = currentUser.value.uid

  if (validateName.value) {
    await authStore.updateUserData({ userId, ...accountInfo.value })
    await authStore.getUserData(userId)
  }
  if (validateEmail.value) {
    await authStore.updateUserEmailAddress({
      email: currentUser.value.email,
      password: accountInfo.value.password,
      newEmail: accountInfo.value.email,
    })
    await authStore.getUser()
    await authStore.getUserData(userId)
  }
}
const cancelChanges = () => {
  if (validateEmail) accountInfo.value.email = currentUser.value.email
  if (validateName)
    (accountInfo.value.firstName = userData.value.firstName),
    (accountInfo.value.lastName = userData.value.lastName)
}
</script>

<template>
  <Main>
    <div class="mt-10 mx-8 mb-8">
      <Typography
        type="text-h1"
        class="mb-8"
      >
        Account information
      </Typography>
      <VRow no-gutters>
        <Avatar
          v-model="accountInfo.imageUrl"
          type="changeAvatar"
          :image="accountInfo.imageUrl"
          @update:modelValue="addUserAvatar"
        />
        <VCol class="ml-5">
          <Typography
            type="text-h4"
            class="mb-1"
          >
            {{ accountInfo.company }}
          </Typography>
        </VCol>
      </VRow>

      <VRow
        no-gutters
        class="mt-8"
        :style="{ maxWidth: '950px' }"
      >
        <VCol cols="auto">
          <Textfield
            v-model.trim="accountInfo.firstName"
            type="text"
            label="First name *"
            required
            class="w-[300px] mx-2 mb-4"
          />
        </VCol>
        <VCol cols="auto">
          <Textfield
            v-model.trim="accountInfo.lastName"
            type="text"
            label="Last name *"
            required
            class="w-[300px] mx-2 mb-4"
          />
        </VCol>
        <VCol cols="auto">
          <Textfield
            v-model.trim="accountInfo.email"
            type="email"
            label="Email *"
            required
            :rules="[rules.email]"
            class="w-[300px] mx-2 mb-4"
          />
        </VCol>
        <VCol cols="auto">
          <Textfield
            v-model.trim="accountInfo.company"
            type="text"
            label="Company name"
            required
            class="w-[300px] mx-2 mb-4"
          />
        </VCol>
        <VCol cols="auto">
          <Textfield
            v-model.trim="accountInfo.phone"
            type="number"
            label="Work phone"
            required
            :rules="[rules.phone]"
            class="w-[300px] mx-2 mb-4"
          />
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="auto">
          <Textfield
            v-model="accountInfo.password"
            label="Password *"
            minlength="8"
            required
            class="w-[300px] mx-2 mb-3"
            :hint="accountInfo.passwordLastChanges"
            persistent-hint
            readonly
            :type="isPasswordVisible ? 'text' : 'password'"
            :append-inner-icon="isPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            @click:append-inner="isPasswordVisible = !isPasswordVisible"
          />
          <PasswordMeter :password="accountInfo.password" />
        </VCol>
        <VCol>
          <Button
            variant="plain"
            class="pl-2 mr-16"
            @click="router.push({ name: 'reset-password' })"
          >
            Change password
          </Button>
        </VCol>
      </VRow>
      <SaveCancelChanges
        class="mt-10"
        :disabled="!validateName && !validateEmail"
        @onSave="onSave"
        @onCancel="cancelChanges"
      />
    </div>
  </Main>
</template>
