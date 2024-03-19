<script setup>
import { Main } from '@layouts'

const router = useRouter()
const tabs = [
  {
    label: 'Yard Details',
  },
  {
    label: 'Team members',
    route: 'teamMembers',
  },
  {
    label: 'Booking rules',
    route: 'bookingRules',
  },
  {
    label: 'Trucker management',
    route: 'truckerManagement',
  },
  {
    label: 'Preferred truckers list',
    route: 'preferredTruckersList',
  },
  {
    label: 'Appearance',
    route: 'appearance',
  },
  {
    label: 'Notifications',
    route: 'notifications',
  },
]
const tab = ref(tabs.findIndex(i => i.route === router.currentRoute.value.query.tab))
const handleTabChange = async value => {
  await router.push({ query: { tab: tabs[value].route } })
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
