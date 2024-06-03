<script setup>
import { useAuthStore } from '~/stores/auth.store'
import { useInvitationStore } from '~/stores/invitation.store'
import { useAlertStore } from '~/stores/alert.store'

const isPasswordVisible = ref(false)
const authStore = useAuthStore()
const invitationStore = useInvitationStore()
const alertStore = useAlertStore()
const router = useRouter()
const form = reactive({
  id: '',
  name: '',
  email: null,
  password: '',
  confirmPassword: '',
})

const onSubmit = async () => {
  const exist = await invitationStore.validateInviteUserEmail('users', form.email)
  if (exist) {
    alertStore.warning({ content: 'User exist!' })
  } else {
    const user = await invitationStore.getInvitationDocData(form.id)
    if (user) {
      await invitationStore.invitedUserRegistration({
        ...user,
        name: form.name,
        password: form.password,
        invitedBy: user.invitedBy,
      })
    } else alertStore.warning({ content: 'User not found' })
  }
}
const isFormValid = () => {
  return form.password && form.confirmPassword && form.password === form.confirmPassword
}

onMounted(async () => {
  const queryParams = router.currentRoute.value.query
  const continueUrl = queryParams.continueUrl
  const urlParams = new URL(continueUrl).searchParams
  form.email = urlParams.get('email')
  form.id = urlParams.get('id')
  await invitationStore.checkInvitation(form.id)
})
</script>

<template>
  <Typography
    type="text-h1 text-center"
    :style="{ marginTop: '140px' }"
  >
    Create user
  </Typography>
  <form
    class="max-w-[730px] mx-auto"
    @submit.prevent="onSubmit"
  >
    <div class="mt-10 grid sm:grid-cols-2 grid-cols-1 gap-4 text-left [&>div]:h-fit">
      <Textfield
        v-model.trim="form.name"
        type="text"
        label="Full name *"
        required
      />
      <Textfield
        v-model="form.email"
        label="Email"
        required
        readonly
        class="pointer-events-none"
      />
      <Textfield
        v-model="form.password"
        label="Password"
        minlength="8"
        required
        :type="isPasswordVisible ? 'text' : 'password'"
        :append-inner-icon="isPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
        @click:append-inner="isPasswordVisible = !isPasswordVisible"
      />
      <Textfield
        v-model="form.confirmPassword"
        type="password"
        label="Confirm password"
        minlength="8"
        required
        class="mb-10"
      />
    </div>
    <Button
      type="submit"
      class="w-100 mx-auto"
      :disabled="!isFormValid()"
    >
      Create Account
    </Button>
  </form>
</template>
