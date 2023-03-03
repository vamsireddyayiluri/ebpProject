<script setup>
import { patterns } from '@qualle-admin/qutil'

const userType = ref('Admin')
const memberType = ref(['Member', 'Admin'])
const members = ref([])
const newMember = reactive({
  email: '',
  type: memberType.value[0],
})
const memberDialog = ref(false)
const removedMember = ref(null)
const onSelectMemberType = type => {
  newMember.type = type
}
const addMember = () => {
  members.value.push({ id: newMember.email, value: newMember.email })
  newMember.email = ''
}

const onChangeMemberType = e => {
  console.log('=>(RegisterView.vue:86) e', e)
}
const openRemoveMemberDialog = memberId => {
  memberDialog.value.show(true)
  removedMember.value = useArrayFind(members.value, m => m.id === memberId).value
}
const removeMember = memberId => {
  members.value = useArrayFilter(members.value, m => m.id !== memberId).value
  memberDialog.value.show(false)
}
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Team members
  </Typography>
  <form
    :style="{ maxWidth: '600px' }"
    @submit.prevent="addMember"
  >
    <VRow
      no-gutters
      class="mt-10 d-flex"
    >
      <VCol
        class="w-100 text-left mr-4"
        cols="12"
        sm=""
      >
        <TextFieldWithSelector
          v-model="newMember.email"
          type="email"
          label="Email"
          :items="memberType"
          item-title="label"
          item-value="id"
          return-object="true"
          @onSelect="onSelectMemberType"
        />
      </VCol>
      <Button
        type="submit"
        variant="outlined"
        :disabled="!newMember.email.match(patterns.emailRegex)"
        class="mt-4 mt-sm-0 mx-auto"
        @click.prevent="addMember"
      >
        Add member
      </Button>
    </VRow>

    <MemberItems
      :members="members"
      is-select
      :selector-data="memberType"
      :is-disabled="userType === 'Member'"
      @onRemove="openRemoveMemberDialog"
      @onSelect="onChangeMemberType"
    />
  </form>

  <Dialog
    ref="memberDialog"
    width="50%"
    min-width="400px"
  >
    <template #text>
      <RemoveTeamMemberDialog
        :removed-member="removedMember"
        @onRemove="removeMember"
      />
    </template>
  </Dialog>
</template>

<style lang="scss" scoped></style>
