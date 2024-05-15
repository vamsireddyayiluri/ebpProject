<script setup>
import { useDisplay, useTheme } from 'vuetify'
import { filterMatchingObjects } from '~/helpers/filters'
import { uid } from 'uid'
import { groupedBookingLocations } from '~/stores/helpers'
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import { getColor } from '~/helpers/colors'
import { useBookingsStore } from '~/stores/bookings.store'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth.store'
import moment from 'moment-timezone'
import { some } from 'lodash'
import { checkVendorDetailsCompletion } from '~/helpers/validations-functions'
import { useCommitmentsStore } from '~/stores/commitments.store'
import { declineCodes, onboardingCodes } from '~/constants/reasonCodes'
import { handleQueryUrlForCommitments } from '~/helpers/links'
import { useNotificationStore } from '~/stores/notification.store'

const props = defineProps({
  mapToggled: Boolean,
})
const emit = defineEmits(['closeMap', 'selectRow'])
const bookingsStore = useBookingsStore()
const { userData } = useAuthStore()
const { approveCommitment, declineCommitment, completeCommitment } = useCommitmentsStore()
const notificationStore = useNotificationStore()
const { loading } = storeToRefs(bookingsStore)
const { liveCommitments } = storeToRefs(notificationStore)
const { smAndDown } = useDisplay()
const router = useRouter()
const route = useRoute()

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
const bookingsData = computed(() => bookingsStore.bookings)
const mutableSearchedEntities = ref(bookingsData.value)
const mutableFilteredEntities = ref(bookingsData.value)
const searchValue = ref(null)
const newId = ref(uid(8))
const bookingStatisticsDialog = ref(null)
const filters = ref({
  line: null,
  loadingDate: null,
})
const selectLine = ref(getAllLines())
const createBookingDialog = ref(null)
const clickedOutside = ref(null)
const bookingConfirmationDialog = ref(null)
const commitmentDetailsDialog = ref(null)
const approveCommitmentDialog = ref(false)
const completeCommitmentDialog = ref(false)
const declineCommitmentDialog = ref(false)
const loadCompleteCommitment = ref(false)

const completeReasonList = [
  onboardingCodes.onboarded,
  onboardingCodes.onboardMovedLoad,
  onboardingCodes.inComplete,
]
const declineReasonList = [
  declineCodes.bookingCanceled,
  declineCodes.bookingRolled,
  declineCodes.tenderedElsewhere,
  declineCodes.other,
]

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
  mapRef.value?.setZoom(15)
  mapRef.value?.panTo({ lat: e.location.lat, lng: e.location.lng })
}
const handleCreateBookingDialog = () => {
  if (checkVendorDetailsCompletion()) {
    createBookingDialog.value.show(true)
  }
}
const duplicateBooking = async ids => {
  const bookings = await bookingsStore.getBookingsByIds({ bookingIds: ids })
  createBookingDialog.value.show(true)
  createBookingDialog.value.data = bookings
}
const closeCreateBookingDialog = () => {
  createBookingDialog.value.show(false)
  createBookingDialog.value.data = null
}
const viewStatistics = e => {
  bookingStatisticsDialog.value.show(true)
  bookingStatisticsDialog.value.data = e
}

const onClearSearch = () => {
  loading.value = true
  setTimeout(() => {
    computedSearchedEntities.value = bookingsStore.bookings
    loading.value = false
  }, 1000)
}

const debouncedSearch = useDebounceFn(searchValue => {
  if (!searchValue) {
    onClearSearch()
  } else {
    computedSearchedEntities.value = useArrayFilter(
      bookingsStore.bookings,
      ({ ref }) =>
        useArraySome(
          useArrayMap(Object.values({ ref }), value => String(value).toLowerCase()).value,
          values => values.includes(searchValue.toLowerCase()),
        ).value,
    ).value
  }
}, 300)

const applyFilter = () => {
  let filteredData = bookingsStore.bookings

  if (filters.value.line) {
    filteredData = useArrayFilter(
      filteredData,
      booking => booking.line.label === filters.value.line,
    ).value
  }
  if (filters.value.loadingDate) {
    const targetDate = moment(filters.value.loadingDate).endOf('day').format()
    filteredData = useArrayFilter(filteredData, booking =>
      booking.details.some(detail => detail.loadingDate === targetDate),
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

const viewCommitmentDetails = data => {
  commitmentDetailsDialog.value.show(true)
  commitmentDetailsDialog.value.data = data
}
const openApproveCommitmentDialog = commitment => {
  approveCommitmentDialog.value.show(true)
  approveCommitmentDialog.value.data = commitment
}
const openCompleteCommitmentDialog = commitment => {
  completeCommitmentDialog.value.show(true)
  completeCommitmentDialog.value.data = commitment
}
const openDeclineCommitmentDialog = data => {
  declineCommitmentDialog.value.show(true)
  declineCommitmentDialog.value.data = data
}
const onApproveCommitment = async commitment => {
  approveCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
  await approveCommitment(commitment)
}
const onCompleteCommitment = async (data, reason, onBoardedContainers) => {
  loadCompleteCommitment.value = true
  await completeCommitment(data, reason, onBoardedContainers)
  completeCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
  loadCompleteCommitment.value = false
}
const onDeclineCommitment = async (commitment, reason) => {
  declineCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
  await declineCommitment(declineCommitmentDialog.value.data, reason)
}
const openCommitmentsDialogOnUrlChange = async () => {
  const commitment = await handleQueryUrlForCommitments(router.currentRoute.value.query)
  commitment &&
    (commitmentDetailsDialog.value.show(true), (commitmentDetailsDialog.value.data = commitment))
}
const onClickOutsideDialog = () => {
  clickedOutside.value = true
  closeCreateBookingDialog()
  setInterval(() => {
    clickedOutside.value = false
  }, 1000)
}

onMounted(async () => {
  await bookingsStore.getBookings({})
  computedSearchedEntities.value = bookingsStore.bookings
  computedFilteredEntities.value = bookingsStore.bookings
  await openCommitmentsDialogOnUrlChange()
  await notificationStore.cancelAndHidePopup()
})
onUnmounted(async () => {
  await notificationStore.schedulePopupToShow()
})
watch(mapToggled, () => {
  toggleMap()
  panes.value = getPanes()
})
watch(searchValue, value => {
  debouncedSearch(value)
})
watch(bookingsData, value => {
  mutableSearchedEntities.value = value
  mutableFilteredEntities.value = value
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
            <Typography type="text-h1 shrink-0"> Bookings</Typography>
          </div>
          <Button
            class="ml-auto px-12"
            @click="handleCreateBookingDialog"
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
        <NeedsProcessingSection
          :items="liveCommitments"
          class="mb-5"
          @onSelect="viewCommitmentDetails"
        />
        <BookingTable
          :computed-entities="computedEntities"
          :search-value="searchValue"
          :loading="loading"
          @selectTableRow="selectTableRow"
          @editBooking="id => router.push({ path: `booking/${id}` })"
          @duplicateBooking="duplicateBooking"
          @openCommitmentDetails="viewCommitmentDetails"
          @openApproveCommitment="openApproveCommitmentDialog"
          @openCompleteCommitment="openCompleteCommitmentDialog"
          @openDeclineCommitment="openDeclineCommitmentDialog"
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
        :markers="groupedBookingLocations(computedEntities)"
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
  <Dialog
    ref="createBookingDialog"
    class="max-w-full max-w-[90vw]"
    @update:modelValue="onClickOutsideDialog"
  >
    <template #text>
      <CreateBookingDialog
        :duplicate="createBookingDialog.data"
        :clicked-outside="clickedOutside"
        @close="closeCreateBookingDialog"
      />
    </template>
  </Dialog>
  <Dialog
    ref="bookingConfirmationDialog"
    class="max-w-full sm:max-w-[90vw] md:max-w-[75vw]"
  >
    <template #text>
      <BookingConfirmationDialog :commitments="[]" />
    </template>
  </Dialog>
  <Dialog
    ref="commitmentDetailsDialog"
    max-width="980"
  >
    <template #text>
      <CommitmentDetailsDialog
        :commitment="commitmentDetailsDialog.data"
        @approveCommitment="openApproveCommitmentDialog"
        @completeCommitment="openCompleteCommitmentDialog"
        @declineCommitment="openDeclineCommitmentDialog"
        @close="commitmentDetailsDialog.show(false)"
      />
    </template>
  </Dialog>

  <Dialog
    ref="approveCommitmentDialog"
    max-width="480"
  >
    <template #text>
      <ConfirmationDialog
        btn-name="Approve"
        btn-type="primary"
        @close="approveCommitmentDialog.show(false)"
        @onClickBtn="onApproveCommitment(approveCommitmentDialog.data)"
      >
        <Typography> Are you sure you want to approve this booking commitment?</Typography>
      </ConfirmationDialog>
    </template>
  </Dialog>
  <Dialog
    ref="completeCommitmentDialog"
    max-width="480"
  >
    <template #text>
      <ReportIssueDialog
        title="Complete commitment"
        :sub-title="`Confirm number of loads moved by ${completeCommitmentDialog.data.truckerCompany}`"
        select-label="Select"
        :reason-list="completeReasonList"
        btn-name="confirm"
        :committed="completeCommitmentDialog.data.committed"
        :loading="loadCompleteCommitment"
        @close="completeCommitmentDialog.show(false)"
        @onClickBtn="
          (e, containers) => onCompleteCommitment(completeCommitmentDialog.data, e, containers)
        "
      />
    </template>
  </Dialog>
  <Dialog
    ref="declineCommitmentDialog"
    max-width="480"
  >
    <template #text>
      <ReportIssueDialog
        title="Decline commitment"
        sub-title="Choose the reason why you want to decline commitment"
        select-label="Select"
        :reason-list="declineReasonList"
        btn-name="decline"
        @close="declineCommitmentDialog.show(false)"
        @onClickBtn="e => onDeclineCommitment(declineCommitmentDialog.data, e)"
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
