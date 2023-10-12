<script setup>
import { Main } from '@layouts'
import { useAuthStore } from '~/stores/auth.store'
import { storeToRefs } from "pinia"

const authStore = useAuthStore()
const { currentUser } = storeToRefs(authStore)
const tab = ref(0)
const tabs = [
  {
    label: 'Booking',
  },
  {
    label: 'Yards',
  },
  {
    label: 'Drafts',
  },
]
const mapToggled = ref(true)

const toggleMap = () => {
  mapToggled.value = !mapToggled.value
}
watch(tab, () => mapToggled.value = true)
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
        />
      </template>
      <template
        v-if="tab !== 2"
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
  </Main>
  <template v-if="tab === 0">
    <BookingTab
      :map-toggled="mapToggled"
      @closeMap="toggleMap"
      @selectRow="toggleMap"
    />
  </template>
</template>
