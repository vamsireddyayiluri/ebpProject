<script setup>
import { usePreferredTruckersStore } from '~/stores/preferredTruckers.store'
import { getColor } from '~/helpers/colors'
import { emailRegex } from '@qualle-admin/qutil/dist/patterns'
import { useAlertStore } from "~/stores/alert.store"

const emit = defineEmits(['close'])
const alertStore = useAlertStore()
const { inviteTrucker, addTrucker } = usePreferredTruckersStore()
const email = ref(null)
const addTruckerDialog = ref(null)
const trucker = ref(null)

const sendInvitation = async () => {
  try {
    const result = await inviteTrucker(email.value)
    if (result === 'sentInvitation') {
      trucker.value = null
      emit('close')
      setTimeout(() => {
        alertStore.info({content: 'The invitation has been sent!'})
      }, 500)
    } else {
      addTruckerDialog.value = true
      trucker.value = result
    }
  }
  catch (e) {
    console.error(e)
  }
}
const addTruckerToPreferred = () => {
  addTrucker(trucker)
  addTruckerDialog.value = false
  emit('close')
}
</script>

<template>
  <template v-if="addTruckerDialog">
    <div class="flex justify-between mb-3">
      <Typography type="text-h3">
        Add trucker
      </Typography>
      <IconButton
        icon="mdi-close"
        class="-mt-1"
        @click="emit('close')"
      />
    </div>
    <Typography class="mb-7">
      This trucker already exists on the platform. You can add him to your list of preferred truckers.
    </Typography>
    <Textfield
      v-model="trucker.email"
      type="email"
      readonly
      class="pointer-events-none"
    />
    <Typography class="mt-4 mb-0.5 ml-4">
      {{ trucker.scac }}
    </Typography>
    <Typography
      class="ml-4"
      :color="getColor('textSecondary')"
    >
      {{ trucker?.email }}
    </Typography>
    <Button
      class="w-full mt-10"
      @click="addTruckerToPreferred"
    >
      add
    </Button>
  </template>
  <template v-else>
    <div class="flex justify-between mb-3">
      <Typography type="text-h3">
        Invite trucker
      </Typography>
      <IconButton
        icon="mdi-close"
        class="-mt-1"
        @click="emit('close')"
      />
    </div>
    <Typography class="mb-7">
      Send an invitation via email. If the trucker accepts the invitation, he will be added to your preferred truckers
      list.
    </Typography>
    <Textfield
      v-model="email"
      type="email"
      label="Email"
      required
    />
    <Button
      class="w-full mt-10"
      :disabled="!emailRegex.test(email)"
      @click="sendInvitation"
    >
      Save
    </Button>
    <Typography
      type="text-body-xs-regular mt-2"
      :color="getColor('textInteractive-01')"
    >
      for example existing trucker with email <b>nintendo12@example.com</b>
    </Typography>
  </template>
</template>
