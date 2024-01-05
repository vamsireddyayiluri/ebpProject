<script setup>
import { patterns } from '@qualle-admin/qutil'
import { useAlertStore } from '~/stores/alert.store'
import { useAuthStore } from '~/stores/auth.store'
import { userTypes } from '~/constants/userTypes'
import { uid } from 'uid'
import { useInvitationStore } from '~/stores/invitation.store'

const props = defineProps({
  teamMembers: Array,
})

const attrs = useAttrs()
const { userData } = useAuthStore()
const invitationStore = useInvitationStore()
const alertStore = useAlertStore()
const route = useRoute()
const { teamMembers } = toRefs(props)
const memberType = [userTypes.operator, userTypes.admin]
const newMember = reactive({
  email: '',
  type: memberType[0],
})
const removeMemberDialog = ref(null)
const workerId = ref('')
const isAdmin = (userData?.type === userTypes?.admin) || !userData

const addInvitation = async () => {
  const userExist = await invitationStore.validateInviteUserEmail('users', newMember.email)
  const invitationExist = await invitationStore.validateInviteUserEmail('invitations', newMember.email)
  if (userExist || invitationExist) {
    alertStore.warning({ content: 'User already exists with this email!' })
  } else {
    teamMembers.value.push({
      id: uid(28),
      value: newMember.email,
      type: newMember.type,
      workerId: workerId.value,
      selected: newMember.type,
    })
    newMember.email = ''
    workerId.value = ''
  }
}
const changeMemberType = async (type, member) => {
  if (type !== member.type) {
    const res = await invitationStore.changeInvitedUserType({...member, type})
    if (res !== 'changed') {
      const m = teamMembers.value.findIndex(i => i.id === member.id)
      teamMembers.value[m] = {...member, type}
    }
  }
}
const handleMemberType = e => newMember.type = e
const openRemoveMemberDialog = memberId => {
  removeMemberDialog.value.show(true)
  removeMemberDialog.value.data = useArrayFind(teamMembers.value, m => m.id === memberId).value
}

const removeMember = async id => {
  const res = await invitationStore.removeInvitedUser(id)
  if (res === 'deleted') {
    const index = teamMembers.value.findIndex(q => q.id === removeMemberDialog.value.data.id)
    teamMembers.value.splice(index, 1)
  }
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
          :select-disabled="!isAdmin"
          return-object="true"
          @onSelect="handleMemberType"
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
        @click="addInvitation"
      >
        add member
      </Button>
    </div>
    <MemberItems
      :members="teamMembers"
      is-select
      :selector-data="memberType"
      class="mt-4"
      @onSelect="changeMemberType"
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
        @onClickBtn="removeMember(removeMemberDialog.data.docId || removeMemberDialog.data.id)"
      >
        <Typography>
          Are you sure you want to remove <b>Member {{ removeMemberDialog?.data.value }}</b>
          from the team?
        </Typography>
      </RemoveCancelDialog>
    </template>
  </Dialog>
</template>
