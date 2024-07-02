<script setup>
import { Main } from '@layouts'
import { useAuthStore } from '~/stores/auth.store'
import { useBookingsStore } from '~/stores/bookings.store'
import { getDownloadURL, ref as firebaseRef } from 'firebase/storage'
import { storage } from '~/firebase'

const authStore = useAuthStore()
const bookingStore = useBookingsStore()
const router = useRouter()
const slides = ref([])
const tour = ref(null)
const slider = ref(0)
const loading = ref(false)
const videoPlaying = ref(true)
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
const tab = ref(tabs.findIndex(i => i.route === router.currentRoute.value.query.tab))
const mapToggled = ref(false)
const skipOnboarding = useSessionStorage('skipOnboarding', false)

const toggleMap = () => {
  mapToggled.value = !mapToggled.value
}
const updateDialog = e => {
  if (!e) skipOnboarding.value = true
}
const showOnboardingLater = async () => {
  skipOnboarding.value = true
  tour.value.show(false)
}
const onboardedUser = async () => {
  tour.value.show(false)
  await authStore.onboardedUser()
}
onMounted(async () => {
  const onboarded = await authStore.checkIfOnboarded()
  if (!onboarded && !skipOnboarding.value) {
    loading.value = true
    const items = [
      {
        header: 'How to add your first yard',
        path: 'assets/onboarding-videos/adding yards.mp4',
      },
      {
        header: 'How to add onboarding documents',
        path: 'assets/onboarding-videos/uploading onboarding documents.mp4',
      },
    ]

    for (const item of items) {
      const fileRef = firebaseRef(storage, item.path)
      try {
        const video = await getDownloadURL(fileRef)
        slides.value.push({ header: item.header, src: video })
      } catch (error) {
        console.error('error', error)
      }
    }
    setTimeout(() => {
      tour.value.show(true)
      loading.value = false
    }, 2000)
  }
})
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
  <OnboardingTour
    ref="tour"
    v-model="slider"
    :slides="slides"
    @nextSlide="videoPlaying = false"
    @previousSlide="videoPlaying = false"
    @close="updateDialog"
  >
    <template #media="{ props }">
      <video
        v-if="!loading"
        controls
        muted
        autoplay
        :pause="videoPlaying"
      >
        <source
          :src="props.src"
          type="video/mp4"
        >
      </video>
    </template>
    <div class="flex justify-center gap-5 mt-8">
      <Button
        density="compact"
        @click="showOnboardingLater"
      >
        show later
      </Button>
      <Button
        density="compact"
        @click="onboardedUser"
      >
        don't show
      </Button>
    </div>
  </OnboardingTour>
</template>
