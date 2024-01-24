<script setup>
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from 'pinia'
import { useInvitationStore } from '~/stores/invitation.store'
import { userTypes } from "~/constants/userTypes"

const authStore = useAuthStore()
const invitationStore = useInvitationStore()
const { userData } = storeToRefs(authStore)
const { invitedUsersData = [] } = storeToRefs(invitationStore)
const teamMembers = ref([])

const validateMembers = computed(() => {
  if (teamMembers.value.length !== invitedUsersData.value.length) return true
  for (let i = 0; i < teamMembers.value.length; i++) {
    if (teamMembers.value[i].id !== invitedUsersData.value[i].id || teamMembers.value[i].workerId !== invitedUsersData.value[i].workerId || teamMembers.value[i].value !== invitedUsersData.value[i].value) {
      return true
    }
  }

  return false
})
const onSave = async () => {
  await invitationStore.sendInvitationLink(teamMembers.value)
  await invitationStore.getInvitedUsersData(userData.value.orgId)
  setMembers()
}
const cancelChanges = () => {
  teamMembers.value = [...invitedUsersData.value]
}
const setMembers = async () => {
  await invitationStore.getInvitedUsersData(userData.value.orgId)
  teamMembers.value = invitedUsersData.value.map(i => {

    return {...i, isDisabled: userData.value.type === userTypes.operator, selected: i.type }
  })
}
onMounted(async () => {
  if (userData.value) {
    setMembers()
  }
})
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Team members
  </Typography>
  <TeamMembers
    class="w-full md:w-11/12 lg:w-8/12"
    :team-members="teamMembers"
  />
  <SaveCancelChanges
    class="mt-10"
    :disabled="!validateMembers"
    @onSave="onSave"
    @onCancel="cancelChanges"
  />
</template>

<style lang="scss" scoped></style>
