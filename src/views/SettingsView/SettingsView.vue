<script setup>
import { getColor } from '~/helpers/colors.js'
import { patterns } from '@qualle-admin/qutil'
import { Main } from '@layouts'
const items = ref([{ label: 'Data reports' }, { label: 'Appearance' }])
const tab = ref(0)
const emptyContainerReport = ref(false)
const exportFacilityReport = ref(false)
const slotItems = ref([])
const slotDialog = ref(false)
const email = ref('')
const members = ref([])
const frequency = ref(null)
const frequencyItems = ref([
  { id: 0, label: 'Every day' },
  { id: 1, label: 'Weekly' },
  { id: 2, label: 'Bi-weekly' },
])
const timeZone = ref(null)
const timeZoneItems = ref([
  '(UTC-12:00) International Date Line West',
  '(UTC-11:00) Coordinated Universal Time-11',
  '(UTC-10:00) Hawaii',
  '(UTC-09:00) Alaska',
  '(UTC-08:00) Baja California',
  '(UTC-07:00) Pacific Daylight Time (US & Canada)',
  '(UTC-08:00) Pacific Standard Time (US & Canada)',
  '(UTC-07:00) Arizona',
])
const time = ref(null)
const editableSlot = ref(null)
const isRemoveMemberDialog = ref(false)
const removedSlot = ref(null)
const removedMember = ref(null)

const toggleEmptyContainerReport = () => {
  emptyContainerReport.value = !emptyContainerReport.value
}
const toggleExportFacilityReport = () => {
  exportFacilityReport.value = !exportFacilityReport.value
}
const openSlotDialog = () => {
  slotDialog.value.show(true)
  editableSlot.value = null
}
const addMember = () => {
  if (editableSlot.value) {
    editableSlot.value.members.push({ id: email.value, value: email.value })
  } else {
    members.value.push({ id: email.value, value: email.value })
  }
  email.value = ''
}

const removeMember = memberId => {
  if (editableSlot) {
    editableSlot.value.members = editableSlot.value.members.filter(m => m.id !== memberId)
  } else members.value = members.value.filter(m => m.id !== memberId)
}
const removeMemberDialog = (slotId, memberId) => {
  isRemoveMemberDialog.value.show(true)
  const slot = useArrayFind(slotItems.value, s => s.id === slotId).value
  removedSlot.value = slot
  removedMember.value = useArrayFind(slot.members, m => m.id === memberId).value
}
const removeMemberFromSlot = memberId => {
  const slot = useArrayFind(slotItems.value, s => s.id === removedSlot.value.id).value
  slot.members = slot.members.filter(m => m.id !== memberId)
  isRemoveMemberDialog.value.show(false)
}
const onChangeTime = $event => {
  time.value = $event.displayTime
}
const onSubmit = () => {
  if (!editableSlot.value) {
    slotItems.value.push({
      id: slotItems.value.length + Date.now(),
      members: members.value,
      frequency: frequency.value,
      timeZone: timeZone.value,
      time: time.value,
    })
    members.value = []
    frequency.value = null
    timeZone.value = null
    time.value = null
  }
  slotDialog.value.show(false)
}
const editSlot = slot => {
  slotDialog.value.show(true)
  editableSlot.value = slot
}
</script>

<template>
  <Main class="settingsView">
    <SubHeader>
      <template #controls>
        <Tabs v-model="tab" :items="items" />
      </template>
    </SubHeader>

    <VContainer fluid class="pt-10 pb-6 px-8">
      <template v-if="!tab">
        <Typography type="text-h1" class="mb-8"> Data reports </Typography>
        <VRow no-gutters justify="start" align="center" class="w-fit">
          <VCol cols="auto">
            <Switch
              id="containers"
              class="mr-3"
              :model-value="emptyContainerReport"
              @click="toggleEmptyContainerReport"
            />
          </VCol>
          <VCol>
            <label for="containers" :style="{ cursor: 'pointer' }">
              <Typography type="text-body-m-regular" class="mb-1">
                Empty container data report
              </Typography>
              <Typography type="text-body-s-regular" :color="getColor('textSecondary')">
                Empty container data report
              </Typography>
            </label>
          </VCol>
        </VRow>

        <VRow no-gutters justify="start" align="center" class="mt-6 w-fit">
          <VCol cols="auto">
            <Switch
              id="facility"
              class="mr-3"
              :model-value="exportFacilityReport"
              @click="toggleExportFacilityReport"
            />
          </VCol>
          <VCol>
            <label for="facility" :style="{ cursor: 'pointer' }">
              <Typography type="text-body-m-regular" class="mb-1">
                Exporter facility data report
              </Typography>
              <Typography type="text-body-s-regular" :color="getColor('textSecondary')">
                Metrics around performance at your exporter customers facilities
              </Typography>
            </label>
          </VCol>
        </VRow>

        <VRow no-gutters justify="start" align="center" class="mt-10">
          <Typography type="text-h3" class="mr-10">Time slots for receiving</Typography>
          <Button prepend-icon="mdi-plus" variant="plain" class="pa-0" @click="openSlotDialog">
            Create new slot
          </Button>
        </VRow>
        <div v-for="slot in slotItems" class="slotsWrapper py-4 px-3 mt-6 rounded">
          <VRow no-gutters justify="space-between">
            <Typography type="text-h4" class="mr-10">
              {{ slot.frequency.label }}; {{ slot.timeZone }}; {{ slot.time }}
            </Typography>
            <IconButton
              icon="mdi-pencil"
              variant="plain"
              size="20"
              width="32"
              min-width="32"
              height="32"
              @click="editSlot(slot)"
            />
          </VRow>
          <VRow no-gutters class="gap-2">
            <MemberItems
              :members="slot.members"
              @onRemove="memberId => removeMemberDialog(slot.id, memberId)"
            />
          </VRow>
        </div>

        <Dialog ref="slotDialog" width="50%" min-width="400px">
          <template #text>
            <Typography type="text-h3">Create slot</Typography>
            <Typography type="text-body-m-regular" class="mt-2 mb-6">
              Create time slot for recipients to receive the reports
            </Typography>
            <form @submit.prevent="addMember">
              <VRow no-gutters align="center" class="gap-4">
                <Textfield v-model="email" type="email" label="Email *" required />
                <Button
                  type="submit"
                  variant="outlined"
                  :disabled="!email.match(patterns.emailRegex)"
                  @click="addMember"
                >
                  Add
                </Button>
              </VRow>
            </form>
            <VRow no-gutters class="gap-2">
              <MemberItems
                :members="editableSlot ? editableSlot.members : members"
                @onRemove="removeMember"
              />
            </VRow>

            <form @submit.prevent="onSubmit">
              <VRow no-gutters class="my-4">
                <template v-if="editableSlot">
                  <VCol cols="6">
                    <Select
                      v-model="editableSlot.frequency"
                      label="Frequency *"
                      :items="frequencyItems"
                      itemTitle="label"
                      itemValue="id"
                      returnObject="true"
                      class="mr-2"
                    />
                  </VCol>
                  <VCol cols="6">
                    <Select
                      v-model="editableSlot.timeZone"
                      label="Time zone *"
                      :items="timeZoneItems"
                      returnObject="true"
                      class="ml-2"
                    />
                  </VCol>
                </template>
                <template v-else>
                  <VCol cols="6">
                    <Select
                      v-model="frequency"
                      label="Frequency *"
                      :items="frequencyItems"
                      itemTitle="label"
                      itemValue="id"
                      returnObject="true"
                      class="mr-2"
                    />
                  </VCol>
                  <VCol cols="6">
                    <Select
                      v-model="timeZone"
                      label="Time zone *"
                      :items="timeZoneItems"
                      returnObject="true"
                      class="ml-2"
                    />
                  </VCol>
                </template>
              </VRow>
              <VRow no-gutters>
                <Timepicker label="Time *" @change="onChangeTime" />
              </VRow>
              <template v-if="editableSlot">
                <Button
                  type="submit"
                  class="w-100 mt-6"
                  :disabled="
                    !editableSlot.members.length ||
                    !editableSlot.frequency?.label ||
                    !editableSlot.timeZone ||
                    !editableSlot.time
                  "
                >
                  Ready
                </Button>
              </template>
              <template v-else>
                <Button
                  type="submit"
                  class="w-100 mt-6"
                  :disabled="!members.length || !frequency?.label || !timeZone || !time"
                >
                  Ready
                </Button>
              </template>
            </form>
          </template>
        </Dialog>
        <Dialog ref="isRemoveMemberDialog" width="50%" min-width="400px">
          <template #text>
            <div class="pa-0">
              Are you sure you want to remove recipient
              <Typography type="text-body-m-semibold" class="d-inline">
                Member {{ removedMember.value }}?
              </Typography>
            </div>

            <Button class="w-100 mt-7" @click="removeMemberFromSlot(removedMember.id)">
              Remove
            </Button>
          </template>
        </Dialog>
      </template>

      <template v-if="tab === 1">
        <AppearanceTab />
      </template>
      <VRow no-gutters class="mt-10">
        <Button class="mr-4">Save</Button>
        <Button variant="outlined"> Cancel changes</Button>
      </VRow>
    </VContainer>
  </Main>
</template>

<style lang="scss" scoped>
.settingsView :deep(.styledSubHeader .v-toolbar__content) {
  height: auto !important;
}
.settingsView :deep(.styledMemberItems) {
  background-color: rgb(var(--v-theme-uiPrimary));
}
.v-select__selection-text {
  white-space: nowrap !important;
  overflow: hidden;
  text-overflow: ellipsis;
}
.settingsView {
  .slotsWrapper {
    background-color: rgb(var(--v-theme-uiPrimaryHover));
  }
  .w-fit {
    width: fit-content;
  }
}
.gap-2 {
  gap: 8px;
}
.gap-4 {
  gap: 16px;
}
</style>

<style lang="scss">
.dropdown-btn {
  padding: 0 !important;
}
</style>
