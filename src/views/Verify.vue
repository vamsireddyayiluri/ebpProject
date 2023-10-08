<script setup>
import { useAuthStore } from '~/stores/auth.store'
import { getColor } from '~/helpers/colors'
const authStore = useAuthStore()

onMounted(() => {
  sendVerifyEmail()
})
const sendVerifyEmail = () => {
  authStore.sendVerificationEmail()
}
</script>

<template>
  <form
    class="mx-auto"
    :style="{ maxWidth: '360px' }"
  >
    <Typography
      type="text-body-m-regular"
      :color="getColor('textSecondary')"
      class="mt-3 mb-10"
    >
      We sent a verification link to the registered email<b />
    </Typography>
    <Button
      type="submit"
      class="w-100 mx-auto"
      @click="openMail"
    >
      Open mailbox
    </Button>

    <Button
      variant="plain"
      class="pl-1"
      @click="sendVerifyEmail"
    >
      Click to resend
    </Button>
  </form>
</template>
