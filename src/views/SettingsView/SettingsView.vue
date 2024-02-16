<script setup>
import { Main } from '@layouts'

const router = useRouter()
const tabs = [
  {
    label: 'Yard Details',
  },
  {
    label: 'Team members',
    to: 'teamMembers',
  },
  {
    label: 'Booking rules',
    to: 'bookingRules',
  },
  {
    label: 'Trucker management',
    to: 'truckerManagement',
  },
  {
    label: 'Preferred truckers list',
    to: 'preferredTruckersList',
  },
  {
    label: 'Appearance',
    to: 'appearance',
  },
  {
    label: 'Notifications',
    to: 'notifications',
  },
]
const tab = computed(() => tabs.findIndex(i => i.to === router.currentRoute.value.query.tab))
const handleTabChange = async value => {
  await router.push({ query: { tab: tabs[value].to} })
}
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
          @update:modelValue="handleTabChange"
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
      <template v-if="tab === 3">
        <TruckerManagementTab />
      </template>
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
