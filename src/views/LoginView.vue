<script setup>
import { getColor } from '~/helpers/colors'
import { useAuthStore } from '~/stores/auth.store'

const authStore = useAuthStore()
const form = ref({
  email: '',
  password: '',
  remember: false,
})
const loading = ref(false)

const onSubmit = async () => {
  loading.value = true
  await authStore.login({ email: form.value.email, password: form.value.password })
  loading.value = false
}
</script>

<template>
  <Typography
    type="text-h1 mt-[140px]"
  >
    Welcome back!
  </Typography>
  <form
    class="mt-10 mx-auto max-w-[360px]"
    @submit.prevent="onSubmit"
  >
    <Textfield
      v-model="form.email"
      type="email"
      label="Email"
      required
    />
    <Textfield
      v-model="form.password"
      type="password"
      label="Password"
      minlength="8"
      required
      class="mt-4 mb-6"
    />
    <VRow
      no-gutters
      align="center"
      justify="space-between"
    >
      <Checkbox
        v-model="form.remember"
        label="Remember me"
      />
      <RouterLink :to="{ name: 'reset-password' }">
        <Typography
          type="text-body-s-semibold"
          :color="getColor('textInteractive-01')"
        >
          Forgot password
        </Typography>
      </RouterLink>
    </VRow>

    <Button
      type="submit"
      :disabled="!form.email || !form.password"
      :loading="loading"
      class="w-full mt-10 mx-auto"
    >
      Log in
    </Button>
  </form>

  <VRow
    no-gutters
    class="flex justify-center items-center mt-4"
  >
    <Typography
      type="text-body-s-regular"
      :style="{ color: getColor('textSecondary') }"
    >
      Already have an account?
    </Typography>
    <RouterLink :to="{ name: 'register' }">
      <Typography
        type="text-body-s-semibold"
        class="p-0 ml-1"
        :color="getColor('textInteractive-01')"
      >
        Sign up
      </Typography>
    </RouterLink>
  </VRow>
</template>

<style lang="scss">
</style>
