<script setup>
import { Main } from '@layouts'
import { getColor } from '~/helpers/colors'

const items = ref([
  { label: 'Account information' },
  { label: 'Team members' },
  { label: 'Region settings' },
])
const tab = ref(0)
const accountInfo = ref({
  companyName: 'Evergreen',
  type: 'Member',
  userEmail: 'alex@example.com',
  companyEmail: 'evergreen@mail.com',
  password: '12345678',
  passwordLastChanges: 'Last change 03/13/2022',
})
const isPasswordVisible = ref(false)
const router = useRouter()
</script>

<template>
  <Main class="profileView">
    <SubHeader>
      <template #controls>
        <Tabs v-model="tab" :items="items" />
      </template>
    </SubHeader>

    <VContainer fluid class="pt-10 pb-6 px-8">
      <template v-if="!tab">
        <Typography type="text-h1" class="mb-8">Account information</Typography>
        <VRow no-gutters>
          <Avatar type="changeAvatar" />
          <VCol class="ml-5">
            <Typography type="text-h4" class="mb-1">Account information</Typography>
            <VRow no-gutters>
              <Typography
                type="text-body-s-regular"
                :color="getColor('textSecondary')"
                class="mr-1"
              >
                {{ accountInfo.type }}
              </Typography>
              <Typography type="text-body-s-semibold" :color="getColor('textSecondary')">
                {{ accountInfo.userEmail }}
              </Typography>
            </VRow>
          </VCol>
        </VRow>

        <VRow no-gutters class="mt-8" :style="{ maxWidth: '650px' }">
          <VCol cols="auto">
            <Textfield
              v-model.trim="accountInfo.companyName"
              type="text"
              label="Company name"
              required
              class="mx-2 mb-4"
              :style="{ width: '300px' }"
            />
          </VCol>
          <VCol cols="auto">
            <Textfield
              v-model.trim="accountInfo.companyEmail"
              type="email"
              label="Email"
              required
              class="mx-2 mb-4"
              :style="{ width: '300px' }"
            />
          </VCol>
          <VCol cols="auto">
            <Textfield
              v-model="accountInfo.password"
              label="Password"
              minlength="8"
              required
              class="mx-2 mb-3"
              :hint="accountInfo.passwordLastChanges"
              persistent-hint
              :type="isPasswordVisible ? 'text' : 'password'"
              :append-inner-icon="isPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              @click:append-inner="isPasswordVisible = !isPasswordVisible"
              :style="{ width: '300px' }"
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
      </template>

      <template v-if="tab === 1">
        <TeamMembersTab />
      </template>
      <template v-if="tab === 2">
        <RegionSettingsTab />
      </template>
      <VRow no-gutters class="mt-10">
        <Button class="mr-4">Save</Button>
        <Button variant="outlined"> Cancel changes</Button>
      </VRow>
    </VContainer>
  </Main>
</template>

<style lang="scss" scoped>
.profileView :deep(.styledSubHeader .v-toolbar__content) {
  height: auto !important;
}
</style>
