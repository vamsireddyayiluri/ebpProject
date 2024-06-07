<script setup>
import { Main } from '@layouts'
import { useAuthStore } from '~/stores/auth.store'
import { useBookingsStore } from '~/stores/bookings.store'

const authStore = useAuthStore()
const bookingStore = useBookingsStore()
const router = useRouter()
const tabs = [
  {
    label: 'Booking',
  },
  {
    label: 'Yards',
    route: 'yards',
  },
  {
    label: 'Drafts',
    route: 'drafts',
  },
  {
    label: 'Booking history',
    route: 'bookingHistory',
  },
]
const mapToggled = ref(false)

const toggleMap = () => {
  mapToggled.value = !mapToggled.value
}
const tab = ref(tabs.findIndex(i => i.route === router.currentRoute.value.query.tab))
const handleTabChange = async value => {
  await router.push({ query: { tab: tabs[value].route } })
}
watch(tab, () => (mapToggled.value = false))
watch(
  () => router.currentRoute.value.fullPath,
  async () => {
    if (router.currentRoute.value.query?.bid) tab.value = 0
  },
)
onUnmounted(async () => {
  await bookingStore.unsubscribeBookings()
})
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
