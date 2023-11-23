<script setup>
import {useAuthStore} from "~/stores/auth.store"
import {storeToRefs} from "pinia"

const authStore = useAuthStore()
const { userData, orgData, invitedUsersData = [] } = storeToRefs(authStore)
const teamMembers = ref([])

const onSave = async () => {
  await authStore.sendInvitationLink(teamMembers.value)
}
const cancelChanges = () => {
}
onMounted(async () => {
  if (userData.value) {
    await authStore.getInvitedUsersData(userData.value.userId)
    teamMembers.value = [...invitedUsersData.value]
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
    @onSave="onSave"
    @onCancel="cancelChanges"
  />
</template>

<style lang="scss" scoped>

</style>
