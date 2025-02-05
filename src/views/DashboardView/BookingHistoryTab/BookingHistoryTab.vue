<script setup>
import truckersData from '~/fixtures/truckers.json'
import { useDisplay } from 'vuetify'
import { useActions, useDate, useHeaders } from '~/composables'
import { getColor } from '~/helpers/colors'
import { useBookingsStore } from '~/stores/bookings.store'
import { storeToRefs } from 'pinia'
import { statuses } from '~/constants/statuses'
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import { filterMatchingObjects, sortBy } from '~/helpers/filters'
import moment from 'moment-timezone'
import { json2csv } from 'json-2-csv'

const bookingsStore = useBookingsStore()
const { loading } = storeToRefs(bookingsStore)
const { getCommitmentsByBookingId, closeBookingExpansion } = bookingsStore
const { smAndDown } = useDisplay()
const { bookingsHistoryHeaders, commitmentsHeaders } = useHeaders()
const { bookingHistoryActions, commitmentsActions } = useActions()
const { getFormattedDate } = useDate()
const router = useRouter()
const statistics = ref(truckersData)
const tableHeight = ref(0)
const searchValue = ref(null)
const mutableSearchedEntities = ref(bookingsStore.pastBookings)
const mutableFilteredEntities = ref(bookingsStore.pastBookings)
const removeBookingDialog = ref(null)
const commitmentDetailsDialog = ref(null)
const filters = ref({
  line: null,
  loadingDate: null,
})
const selectLine = ref(getAllLines())
const sorted = ref('mostRecent')

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
  sortBy(
    filterMatchingObjects(computedSearchedEntities.value, computedFilteredEntities.value),
    sorted.value,
  ),
)
const bookingStatus = id => {
  const bookings = computedEntities.value
  const booking = bookings.find(i => i?.id === id)

  return booking?.status
}
const onClearSearch = () => {
  loading.value = true

  setTimeout(() => {
    computedSearchedEntities.value = bookingsStore.pastBookings

    loading.value = false
  }, 1000)
}

const debouncedSearch = useDebounceFn(searchValue => {
  if (!searchValue) {
    onClearSearch()
  } else {
    computedSearchedEntities.value = useArrayFilter(
      bookingsStore.pastBookings,
      ({ ref, line: { label }, location: { label: address } }) =>
        useArraySome(
          useArrayMap(Object.values({ ref, label, address }), value => String(value).toLowerCase())
            .value,
          values => values.includes(searchValue.toLowerCase()),
        ).value,
    ).value
  }
}, 300)
const applyFilter = () => {
  let filteredData = bookingsStore.pastBookings

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
  computedFilteredEntities.value = filteredData
}
const clearDateFilter = () => {
  filters.value.loadingDate = null
  applyFilter()
}
const onSort = item => {
  sorted.value = item.value
}
const containerActionHandler = ({ action, e }) => {
  if (action === 'delete-booking') {
    removeBookingDialog.value.show(true)
    removeBookingDialog.value.data = e[0]
  }
  if (action === 'duplicate') {
  }
  if (action === 'view-trucker-details') {
    commitmentDetailsDialog.value.show(true)
    commitmentDetailsDialog.value.data = e[0]
  }
  if (action === 're-activate') {
    router.push({ path: `booking/${e[0].id}`, query: { from: 'history', activated: true } })
  }
}
const removeBooking = async id => {
  await bookingsStore.deleteBooking(id, false, true)
  removeBookingDialog.value.show(false)
}
const onSelectRow = e => {
  router.push({ path: `booking/${e.id}`, query: { from: 'history' } })
}
const rowExpanded = async (event, data) => {
  const { id, ids } = toRaw(data.value)
  if (event) {
    const commitments = await getCommitmentsByBookingId(id, ids, true)
    data.value.expand = true
    data.value.entities = commitments
  } else {
    await closeBookingExpansion(id, true)
  }
}
const downloadData = async () => {
  const options = {}
  const csv = await json2csv(bookingsStore.pastBookings, options)
  const csvContent = 'data:text/csv;charset=utf-8,' + csv
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `booking-history-${getFormattedDate(moment())}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
onMounted(async () => {
  await bookingsStore.getBookingHistory()
  computedSearchedEntities.value = bookingsStore.pastBookings
  computedFilteredEntities.value = bookingsStore.pastBookings
})
const tableId = 'bookingsHistoryTable'
onMounted(() => {
  setTimeout(() => {
    const table = document.getElementById(tableId)
    tableHeight.value = smAndDown.value
      ? 396
      : window.innerHeight - table.getBoundingClientRect().top - 119 + 'px'
  })
})
watch(searchValue, value => {
  debouncedSearch(value)
})
</script>

<template>
  <div class="h-full pt-[37px] px-8 pb-8">
    <Typography
      type="text-h1"
      class="mb-8"
    >
      Booking history
    </Typography>
    <div class="flex flex-wrap justify-between items-center gap-5 mb-5">
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
      <Sort
        size="48"
        icon-size="24"
        :items="[
          { label: 'Most recent', value: 'mostRecent' },
          { label: 'Least recent', value: 'leastRecent' },
        ]"
        @onSelect="onSort"
      />
      <IconButton
        width="48"
        height="48"
        variant="outlined"
        class="ml-auto"
        :color="getColor('uiLine')"
        @click="downloadData"
      >
        <Icon
          icon="mdi-download"
          size="24"
          :color="getColor('iconButton-1')"
        />
        <Tooltip> Download datatable</Tooltip>
      </IconButton>
    </div>
    <VirtualTable
      :id="tableId"
      :key="tableId"
      :entities="computedEntities"
      :headers="bookingsHistoryHeaders"
      :loading="loading"
      :options="{
        rowHeight: 64,
        showActions: true,
        tableMinWidth: 960,
        expansionRow: true,
      }"
      class="mb-5"
      @onSelectRow="onSelectRow"
      @onRowExpanded="rowExpanded"
    >
      <template #ref="{ item }">
        <Typography>
          <Highlighter
            v-if="searchValue"
            :query="searchValue"
          >
            {{ item.ref }}
          </Highlighter>
          <template v-else>
            {{ item.ref }}
          </template>
        </Typography>
      </template>
      <template #yardLabel="{ item }">
        <FlexTypography type="text-body-m-regular">
          <Highlighter
            v-if="searchValue"
            :query="searchValue"
          >
            {{ item.location.label }}
          </Highlighter>
          <template v-else>
            {{ item.location.label || '--' }}
          </template>
        </FlexTypography>
      </template>
      <template #ssl="{ item }">
        <Typography>
          <LineAvatar :line="item.line" />
        </Typography>
      </template>
      <template #bookingExpiry="{ item }">
        <BookingLoadingDateColumn :data="item" />
      </template>
      <template #status="{ item }">
        <Classification
          type="status"
          :value="item.status === statuses.expired ? 'incomplete' : item.status.replace('_', ' ')"
        />
      </template>
      <template #truckers="{ item }">
        <div
          v-if="item?.scacList?.length > 0"
          class="flex items-center gap-2"
        >
          <template
            v-for="scacList in item.scacList"
            :key="scacList"
          >
            <template v-if="scacList.length <= 2">
              <template
                v-for="scac in scacList"
                :key="scac"
              >
                <Chip>
                  {{ scac || '--' }}
                </Chip>
              </template>
            </template>
            <template v-else>
              <template
                v-for="scac in scacList.slice(0, 1)"
                :key="scac"
              >
                <Chip>
                  {{ scac || '--' }}
                </Chip>
              </template>
            </template>
            <template v-if="scacList.length > 2">
              <Typography
                type="text-body-xs-semibold"
                class="py-3"
              >
                + {{ scacList.slice(1).length }} truckers
                <Popover
                  activator="parent"
                  location="top center"
                >
                  <div class="flex gap-2 py-1">
                    <template
                      v-for="scac in scacList.slice(1)"
                      :key="scac"
                    >
                      <Chip>
                        {{ scac || '--' }}
                      </Chip>
                    </template>
                  </div>
                </Popover>
              </Typography>
            </template>
          </template>
        </div>
        <div v-else>
          <span>--</span>
        </div>
      </template>
      <template #actions="{ item, selected }">
        <template v-if="item.status === statuses.completed || item.status === statuses.canceled">
          <IconButton
            icon="mdi-delete"
            size="24"
            class="-mr-1.5"
            @click.stop="removeBookingDialog.show(true), (removeBookingDialog.data = item)"
          >
            <Tooltip> Remove booking</Tooltip>
          </IconButton>
        </template>
        <MenuActions
          v-else
          :actions="() => bookingHistoryActions(item)"
          :disabled="bookingHistoryActions(item)?.length < 1"
          :selected="selected"
          :container="item"
          @containerActionHandler="containerActionHandler"
        />
      </template>
      <template #expansion="{ item }">
        <VirtualTable
          :entities="item.entities"
          :headers="commitmentsHeaders"
          :options="{
            rowHeight: 64,
            showActions: true,
            tableHeight: 575,
            tableMinWidth: 640,
          }"
          class="pl-16"
        >
          <template #trucker="{ item }">
            <Typography>
              {{ item.truckerCompany }}
            </Typography>
          </template>
          <template #committed="{ item }">
            <Typography>
              {{ item.committed }}
            </Typography>
          </template>
          <template #loadingDate="{ item }">
            <Typography type="text-body-m-regular">
              {{ getFormattedDate(item.loadingDate) }}
            </Typography>
          </template>
          <template #status="{ item }">
            <Classification
              type="status"
              :value="item.status.replace('_', ' ')"
            />
          </template>
          <template #actions="{ item, selected }">
            <MenuActions
              :actions="
                () =>
                  commitmentsActions(
                    item.status,
                    bookingStatus(item.bookingId),
                    (fromHistory = true),
                  )
              "
              :selected="selected"
              :container="item"
              @containerActionHandler="containerActionHandler"
            />
          </template>
        </VirtualTable>
      </template>
    </VirtualTable>
  </div>
  <Dialog
    ref="removeBookingDialog"
    max-width="480"
  >
    <template #text>
      <ConfirmationDialog
        btn-name="Remove"
        @close="removeBookingDialog.show(false)"
        @onClickBtn="removeBooking(removeBookingDialog.data.ids)"
      >
        <Typography>
          Are you sure you want to remove ref#
          <b>{{ removeBookingDialog.data.ref }}</b>
          from your bookings?
        </Typography>
      </ConfirmationDialog>
    </template>
  </Dialog>
  <Dialog
    ref="commitmentDetailsDialog"
    max-width="980"
  >
    <template #text>
      <CommitmentDetailsDialog
        :commitment="commitmentDetailsDialog.data"
        @close="commitmentDetailsDialog.show(false)"
      />
    </template>
  </Dialog>
</template>

<style lang="scss">
#bookingsHistoryTable.virtual-table-wrapper {
  .scroller {
    height: 100%;
    max-height: v-bind(tableHeight);

    .virtual-table-wrapper {
      .scroller {
        height: auto;
        max-height: fit-content;
      }
    }
  }
}
</style>
