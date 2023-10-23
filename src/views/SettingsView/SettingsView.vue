<script setup>
import { Main } from '@layouts'

const tab = ref(0)
const tabs = [
  {
    label: 'Work details',
  },
  {
    label: 'Team members',
  },
  {
    label: 'Booking rules',
  },
  {
    label: 'Trucker management',
  },
  {
    label: 'Preferred truckers list',
  },
  {
    label: 'Appearance',
  },
  {
    label: 'Notifications',
  },
]
</script>

<template>
  <Main>
    <SubHeader
      show-arrows
      sticky
      class="top-16 z-10"
    >
      <template #controls="props">
        <Tabs
          v-model="tab"
          :items="tabs"
          v-bind="props"
        />
      </template>
    </SubHeader>
    <div class="h-full pt-10 px-8 pb-8">
      <template v-if="!tab">
        <WorkDetailsTab />
      </template>
      <template v-if="tab === 1">
        <TeamMembersTab />
      </template>
      <template v-if="tab === 2">
        <BookingRulesTab />
      </template>
      <template v-if="tab === 3" />
      <template v-if="tab === 4">
        <PreferredTruckersTab />
      </template>
      <template v-if="tab === 5">
        <AppearanceTab />
      </template>
      <template v-if="tab === 6">
        <NotificationsTab />
      </template>
    </div>
  </Main>
</template>
