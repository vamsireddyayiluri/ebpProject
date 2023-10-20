<script setup>
import { useDisplay, useTheme } from 'vuetify'
import draftsData from '~/fixtures/drafts.json'
import { filterMatchingObjects } from '~/helpers/filters'
import { uid } from 'uid'
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import { getColor } from '~/helpers/colors'
import { groupedBookingLocations } from '~/stores/helpers'

const props = defineProps({
  mapToggled: Boolean,
})
const emit = defineEmits(['closeMap', 'selectRow'])
const { smAndDown } = useDisplay()
const router = useRouter()
const paneOpened = ref(false)
const mapRef = ref(null)
const { mapToggled } = toRefs(props)
const getPanes = () => {
  return mapToggled.value
    ? [
      { name: 'content', size: 60 },
      { name: 'map', size: 40 },
    ]
    : [{ name: 'content', size: 100 }]
}
const panes = ref(getPanes())
const vuetifyTheme = useTheme()
const theme = computed(() => vuetifyTheme.global.name.value)
const panesRef = ref(null)
const mutableSearchedEntities = ref([...JSON.parse(JSON.stringify(draftsData))])
const mutableFilteredEntities = ref([...JSON.parse(JSON.stringify(draftsData))])
const searchValue = ref(null)
const loading = ref(false)
const newId = ref(uid(8))
const filters = ref({
  ssl: null,
})
const selectLine = ref(getAllLines())

const computedSearchedEntities = computed({
  get() {
    return mutableSearchedEntities.value
  },
  set(value) {
    mutableSearchedEntities.value = value
  },
})
const computedFilteredEntities = computed({
  get() {
    return mutableFilteredEntities.value
  },
  set(value) {
    mutableFilteredEntities.value = value
  },
})
const computedEntities = computed(() =>
  filterMatchingObjects(computedSearchedEntities.value, computedFilteredEntities.value),
)

const mapOptions = markRaw({ zoom: 1, zoomControls: false })
const onMapLoaded = async ({ api, map }) => {
  mapRef.value = map
}

const renderMarkerIcon = marker => {
  return {
    icon: 'garage',
    color: 'textTertiary',
    bgColor: 'uiInteractive',
    bgColorHover: 'mapMarkerInteraction-1',
    count: marker.entities.length,
  }
}
const toggleMap = () => {
  const panes = toRaw(panesRef.value)
  panes.toggleMap()
}

const onSplitPaneClosed = e => emit('closeMap')
const onSplitPaneResized = ({ size }) => {
  paneOpened.value = Boolean(size >= 60)
}
const onSplitterClicked = e => {
  const { size } = e

  paneOpened.value = Boolean(size < 100)
}

const selectTableRow = e => {
  if (!mapToggled.value) {
    emit('selectRow')
  }
  mapRef.value.setZoom(15)
  mapRef.value.panTo({ lat: e.location.lat, lng: e.location.lng })
}

const onClearSearch = () => {
  loading.value = true

  setTimeout(() => {
    computedSearchedEntities.value = computedFilteredEntities.value

    loading.value = false
  }, 1000)
}

const debouncedSearch = useDebounceFn(searchValue => {
  if (!searchValue) {
    onClearSearch()
  } else {
    computedSearchedEntities.value = useArrayFilter(
      draftsData,
      ({ ref, location: { label } }) =>
        useArraySome(
          useArrayMap(Object.values({ ref, label }), value => String(value).toLowerCase()).value,
          values => values.includes(searchValue.toLowerCase()),
        ).value,
    ).value
  }
}, 300)

const applyFilter = () => {
  let filteredData = draftsData

  if (filters.value.ssl) {
    filteredData = useArrayFilter(
      filteredData,
      container => container.line.label === filters.value.ssl,
    ).value
  }
  computedFilteredEntities.value = filteredData
}

watch(mapToggled, () => {
  toggleMap()
  panes.value = getPanes()
})
watch(searchValue, value => {
  debouncedSearch(value)
})
</script>

<template>
  <Panes
    ref="panesRef"
    :panes="panes"
    class="!h-[calc(100vh-121px)]"
    @onSplitPaneClosed="onSplitPaneClosed"
    @onSplitPaneResized="onSplitPaneResized"
    @onSplitterClicked="onSplitterClicked"
  >
    <template #content>
      <div
        class="pt-8 pl-8 pr-5 pb-8 flex flex-column h-full"
        :class="{ 'pr-8': !mapToggled || smAndDown }"
      >
        <div class="flex flex-wrap items-center gap-4 mb-7">
          <div class="flex justify-between sm:justify-normal items-center gap-4">
            <Typography type="text-h1 shrink-0">
              Yards
            </Typography>
          </div>
          <Button
            class="ml-auto px-12"
            @click="rstDialog.show(true)"
          >
            Create booking
          </Button>
        </div>
        <div class="flex gap-4 mb-5">
          <Textfield
            v-model="searchValue"
            type="text"
            placeholder="Search..."
            prepend-inner-icon="mdi-magnify"
            clearable
            class="max-w-[280px] min-w-[160px]"
            @click:clear="onClearSearch"
          />
          <Select
            v-model="filters.ssl"
            :items="selectLine"
            label="SSL"
            item-title="label"
            item-value="type"
            clearable
            class="max-w-[224px]"
            @update:modelValue="applyFilter"
          />
        </div>
        <DraftsTable
          :computed-entities="computedEntities"
          :search-value="searchValue"
          :loading="loading"
          @selectTableRow="selectTableRow"
          @editDraft="ref => router.push({ path: `booking/${ref}`, state: {from: 'draft'}})"
        />
      </div>
    </template>
    <template #map>
      <VFadeTransition>
        <div
          v-if="paneOpened"
          class="w-full flex position-absolute top-8 right-8 z-10"
        >
          <VSpacer class="mr-4" />
          <div
            class="w-full flex justify-end flex-wrap gap-5 [&>div]:w-full [&>div]:min-w-[220px] [&>div]:max-w-[288px]"
          >
            <Select
              v-model="filters.ssl"
              :items="selectLine"
              label="SSL"
              item-title="label"
              item-value="type"
              clearable
              class="max-w-[224px]"
              :style="{ background: getColor('uiPrimary') }"
              @update:modelValue="applyFilter"
            />
          </div>
        </div>
      </VFadeTransition>
      <Map
        :key="newId"
        :map-options="mapOptions"
        :markers="groupedBookingLocations(computedEntities)"
        render-marker-cluster
        :theme="theme"
        @onMapLoaded="onMapLoaded"
      >
        <template #marker="{ marker }">
          <MarkerIcon :type="renderMarkerIcon(marker)" />
        </template>
        <template #infoWindow="{ marker }">
          <DraftMapPopup :draft="marker" />
        </template>
      </Map>
    </template>
  </Panes>
</template>

<style lang="scss">
.splitpanes__pane {
  height: calc(100vh - 121px);
  position: relative;
}
</style>
