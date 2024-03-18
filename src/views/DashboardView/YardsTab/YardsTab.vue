<script setup>
import { useDisplay, useTheme } from 'vuetify'
import { filterMatchingObjects } from '~/helpers/filters'
import { uid } from 'uid'
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import { getColor } from '~/helpers/colors'
import { useBookingsStore } from '~/stores/bookings.store'
import { storeToRefs } from 'pinia'
import { groupedBookingLocations } from '~/stores/helpers'
import { useAuthStore } from '~/stores/auth.store'
import moment from 'moment-timezone'
import { some } from 'lodash'

const props = defineProps({
  mapToggled: Boolean,
})
const emit = defineEmits(['closeMap', 'selectRow'])
const bookingsStore = useBookingsStore()
const { userData } = useAuthStore()
const { bookings } = storeToRefs(bookingsStore)
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
const mutableSearchedEntities = ref(bookings.value)
const mutableFilteredEntities = ref(bookings.value)
const searchValue = ref(null)
const loading = ref(false)
const newId = ref(uid(8))
const bookingStatisticsDialog = ref(null)
const filters = ref({
  line: null,
  loadingDate: null,
})
const selectLine = ref(getAllLines())
const createBookingDialog = ref(null)
const clickedOutside = ref(null)

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
  groupedBookingLocations(
    filterMatchingObjects(computedSearchedEntities.value, computedFilteredEntities.value),
  ),
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
    bgColorHover: 'uiInteractiveHover',
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

const viewStatistics = e => {
  bookingStatisticsDialog.value.show(true)
  bookingStatisticsDialog.value.data = e
}

const onClearSearch = () => {
  loading.value = true
  setTimeout(() => {
    computedSearchedEntities.value = bookings.value
    loading.value = false
  }, 1000)
}

const debouncedSearch = useDebounceFn(searchValue => {
  if (!searchValue) {
    onClearSearch()
  } else {
    computedSearchedEntities.value = useArrayFilter(
      bookings.value,
      ({ location: { address, label } }) =>
        useArraySome(
          useArrayMap(Object.values({ address, label }), value => String(value).toLowerCase())
            .value,
          values => values.includes(searchValue.toLowerCase()),
        ).value,
    ).value
  }
}, 300)

const applyFilter = () => {
  let filteredData = bookings.value

  if (filters.value.line) {
    filteredData = useArrayFilter(
      filteredData,
      yard => yard.line.label === filters.value.line,
    ).value
  }
  if (filters.value.loadingDate) {
    filteredData = useArrayFilter(
      filteredData,
      booking => booking.bookingExpiry === moment(filters.value.loadingDate).endOf('day').format(),
    ).value
  }
  const isFiltered = some(filters.value, value => !!value)
  if (!isFiltered && !searchValue.value) {
    computedSearchedEntities.value = filteredData
  }
  computedFilteredEntities.value = filteredData
}
const clearDateFilter = () => {
  filters.value.loadingDate = null
  applyFilter()
}
const onClickOutsideDialog = () => {
  clickedOutside.value = true
  createBookingDialog.value.show(true)
  setInterval(() => {
    clickedOutside.value = false
  }, 1000)
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
        class="pt-8 pl-8 pr-5 pb-8 flex flex-column"
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
            @click="createBookingDialog.show(true)"
          >
            Create booking
          </Button>
        </div>
        <div class="flex gap-4 flex-wrap mb-5">
          <Textfield
            v-model="searchValue"
            type="text"
            placeholder="Search..."
            prepend-inner-icon="mdi-magnify"
            clearable
            class="max-w-[280px] min-w-[160px]"
            @click:clear="onClearSearch"
          />
          <Datepicker
            v-model="filters.loadingDate"
            label="Loading date"
            clearable
            class="w-full max-w-[280px]"
            @onUpdate="applyFilter"
            @clearDate="clearDateFilter"
          />
          <Select
            v-model="filters.line"
            :items="selectLine"
            label="SSL"
            item-title="label"
            item-value="type"
            clearable
            class="max-w-[280px] min-w-[160px]"
            @update:modelValue="applyFilter"
          />
        </div>
        <YardsTable
          :computed-entities="computedEntities"
          :search-value="searchValue"
          :loading="loading"
          @selectTableRow="selectTableRow"
          @editBooking="id => router.push({ path: `booking/${id}` })"
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
              v-model="filters.line"
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
        :markers="computedEntities"
        render-marker-cluster
        :theme="theme"
        @onMapLoaded="onMapLoaded"
      >
        <template #marker="{ marker }">
          <div @click="viewStatistics(marker)">
            <MarkerIcon :type="renderMarkerIcon(marker)" />
          </div>
        </template>
        <template #infoWindow="{ marker }">
          <BookingsMapPopup :booking="marker" />
        </template>
      </Map>
    </template>
  </Panes>
  <Dialog
    ref="createBookingDialog"
    class="max-w-full sm:max-w-[90vw] md:max-w-[75vw]"
    @update:modelValue="onClickOutsideDialog"
  >
    <template #text>
      <CreateBookingDialog
        :clicked-outside="clickedOutside"
        @close="createBookingDialog.show(false)"
      />
    </template>
  </Dialog>
  <Dialog
    ref="bookingStatisticsDialog"
    class="max-w-[720px] md:max-w-[980px]"
  >
    <template #text>
      <BookingStatisticsDialog
        :booking="bookingStatisticsDialog.data"
        @close="bookingStatisticsDialog.show(false)"
      />
    </template>
  </Dialog>
</template>

<style lang="scss">
.splitpanes__pane {
  height: calc(100vh - 121px);
  position: relative;
}
</style>
