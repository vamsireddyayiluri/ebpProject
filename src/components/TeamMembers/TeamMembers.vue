<script setup>
import { patterns } from '@qualle-admin/qutil'
import { useAlertStore } from '~/stores/alert.store'
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from 'pinia'
import { userTypes } from '~/constants/userTypes'

const props = defineProps({
  teamMembers: Array,
})

const attrs = useAttrs()

const authStore = useAuthStore()
const alertStore = useAlertStore()
const { invitedUsersData = [] } = storeToRefs(authStore)
const route = useRoute()
const { teamMembers } = toRefs(props)
const memberType = [userTypes.operator, userTypes.admin]
const newMember = reactive({
  email: '',
  type: memberType[0],
})
const removeMemberDialog = ref(null)
const removedMember = ref(null)
const workerId = ref('')

const sendInvitation = async () => {
  const value = await authStore.validateInviteUserEmail(newMember.email)
  if (value) {
    alertStore.warning({ content: 'User already exists with this email!' })
  } else {
    teamMembers.value.push({
      id: newMember.email,
      value: newMember.email,
      type: newMember.type,
      workerId: `Worker ID: ${workerId.value}`,
    })
    newMember.email = ''
    workerId.value = ''
  }
}
const openRemoveMemberDialog = memberId => {
  removedMember.value = useArrayFind(teamMembers.value, m => m.id === memberId).value
  removeMemberDialog.value.show(true)
}

const removeMember = () => {
  teamMembers.value = useArrayFilter(teamMembers.value, m => m.id !== removedMember.value.id).value
  removeMemberDialog.value.show(false)
}
</script>

<template>
  <div v-bind="{ ...attrs }">
    <div class="flex flex-wrap gap-4">
      <div class="w-full">
        <TextFieldWithSelector
          v-model="newMember.email"
          type="email"
          label="Email"
          :items="memberType"
          item-title="label"
          item-value="id"
          return-object="true"
        />
      </div>
      <Textfield
        v-model.trim="workerId"
        type="text"
        label="Worker ID"
        class="w-56 h-fit"
      />
      <Button
        variant="outlined"
        :disabled="!newMember.email.match(patterns.emailRegex) || !workerId"
        class="w-full sm:w-fit"
        @click="sendInvitation"
      >
        add member
      </Button>
    </div>
    <MemberItems
      :members="teamMembers"
      is-select
      :selector-data="memberType"
      class="mt-4"
      @onRemove="openRemoveMemberDialog"
    />
  </div>
  <Dialog
    ref="removeMemberDialog"
    max-width="480"
  >
    <template #text>
      <RemoveCancelDialog
        btn-name="Remove"
        @close="removeMemberDialog.show(false)"
        @onClickBtn="removeMember"
      >
        <Typography>
          Are you sure you want to remove <b>Member {{ removedMember?.value }}</b>
          from the team?
        </Typography>
      </RemoveCancelDialog>
    </template>
  </Dialog>
</template>
