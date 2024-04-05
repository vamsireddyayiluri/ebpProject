<script setup>
import { Main } from '@layouts'
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from 'pinia'
import { emailRegex } from '@qualle-admin/qutil/dist/patterns'
import { useProfileStore } from '~/stores/profile.store'
import { useAlertStore } from '~/stores/alert.store'
import { vMaska, Mask } from 'maska'
import { cellMask } from '~/helpers/mask'

const authStore = useAuthStore()
const alertStore = useAlertStore()
const profileStore = useProfileStore()
const { currentUser, userData } = storeToRefs(authStore)
const { accountInfo } = storeToRefs(profileStore)

const isPasswordVisible = ref(false)
const router = useRouter()
const unMaskedCell = ref({})
const options = { mask: cellMask }
const rules = {
  email(value) {
    return emailRegex.test(value) || 'Invalid e-mail'
  },
  cell() {
    return /^\+1 \d{3} \d{3}-\d{2}-\d{2}$/ || 'Invalid phone number'
  },
  password(value) {
    return value > 8 || 'Min length 8'
  },
}
const updateUserAvatar = async (_, file) => {
  await profileStore.updateUserAvatar(file)
}
const validateName = computed(() => {
  return (
    accountInfo.value.name !== userData.value?.name ||
    accountInfo.value.company !== userData.value?.company ||
    unMaskedCell.value.unmasked !== userData.value?.cell
  )
})
const validateEmail = computed(() => {
  return accountInfo.value.email !== userData.value?.email
})
const onSave = async () => {
  const userId = currentUser.value.uid

  try {
    if (validateName.value) {
      await profileStore.updateUserData({ userId, ...accountInfo.value, cell: unMaskedCell.value.unmasked })
    }
    if (validateEmail.value) {
      await profileStore.updateUserEmailAddress({
        email: currentUser.value.email,
        password: accountInfo.value.password,
        newEmail: accountInfo.value.email,
      })
    }
    alertStore.info({ content: 'Profile updated!' })
  } catch (e) {}
  await authStore.getUserData(userId)
}
const cancelChanges = () => {
  if (validateEmail) accountInfo.value.email = currentUser.value.email
  if (validateName) accountInfo.value.name = userData.value.name
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
          @update:modelValue="updateUserAvatar"
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
        :style="{ maxWidth: '750px' }"
      >
        <VCol cols="auto">
          <Textfield
            v-model.trim="accountInfo.name"
            type="text"
            label="Full name *"
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
            v-model.trim="accountInfo.cell"
            v-maska:[options]="unMaskedCell"
            type="tel"
            label="Work phone"
            required
            :rules="[rules.cell]"
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
