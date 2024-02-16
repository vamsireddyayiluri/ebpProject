<script setup>
import { Main } from '@layouts'
import { useAuthStore } from '~/stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()
const tabs = [
  {
    label: 'Booking',
  },
  {
    label: 'Yards',
    to: 'yards',
  },
  {
    label: 'Drafts',
    to: 'drafts',
  },
  {
    label: 'Booking history',
    to: 'bookingHistory',
  },
]
const mapToggled = ref(false)

const toggleMap = () => {
  mapToggled.value = !mapToggled.value
}
const tab = computed(() => tabs.findIndex(i => i.to === router.currentRoute.value.query.tab))
const handleTabChange = async value => {
  await router.push({ query: { tab: tabs[value].to} })
}
watch(tab, () => (mapToggled.value = false))
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
          class="mr-[90px]"
          @update:modelValue="handleTabChange"
        />
      </template>
      <template
        v-if="tab !== 3"
        #actions
      >
        <Button
          prepend-icon="mdi-map-marker"
          variant="plain"
          v-bind="!mapToggled && { secondary: 'false' }"
          @click="toggleMap"
        >
          Map
        </Button>
      </template>
    </SubHeader>
    <template v-if="tab === 0">
      <BookingTab
        :map-toggled="mapToggled"
        @closeMap="toggleMap"
        @selectRow="toggleMap"
      />
    </template>
    <template v-if="tab === 1">
      <YardsTab
        :map-toggled="mapToggled"
        @closeMap="toggleMap"
        @selectRow="toggleMap"
      />
    </template>
    <template v-if="tab === 2">
      <DraftsTab
        :map-toggled="mapToggled"
        @closeMap="toggleMap"
        @selectRow="toggleMap"
      />
    </template>
    <template v-if="tab === 3">
      <BookingHistoryTab />
    </template>
  </Main>
</template>
