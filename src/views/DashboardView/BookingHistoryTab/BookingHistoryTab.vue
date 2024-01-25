<script setup>
import truckersData from '~/fixtures/truckers.json'
import { useDisplay } from 'vuetify'
import { useActions, useDate, useHeaders } from '~/composables'
import { getColor } from '~/helpers/colors'
import { useBookingHistoryStore } from '~/stores/bookingHistory.store'
import { storeToRefs } from 'pinia'
import { statuses } from '~/constants/statuses'

const bookingsStore = useBookingHistoryStore()
const { loading } = storeToRefs(bookingsStore)
const { smAndDown } = useDisplay()
const { bookingsHistoryHeaders } = useHeaders()
const { bookingHistoryActions } = useActions()
const { getFormattedDateTime } = useDate()
const router = useRouter()
const statistics = ref(truckersData)
const tableHeight = ref(0)
const searchValue = ref(null)
const computedSearchedEntities = ref(bookingsStore.bookings)
const removeBookingDialog = ref(null)

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
      ({ ref, line: { label }, location: { label: address } }) =>
        useArraySome(
          useArrayMap(Object.values({ ref, label, address }), value => String(value).toLowerCase())
            .value,
          values => values.includes(searchValue.toLowerCase()),
        ).value,
    ).value
  }
}, 300)
const containerActionHandler = ({ action, e }) => {
  if (action === 'delete-booking') {
    removeBookingDialog.value.show(true)
    removeBookingDialog.value.data = e[0]
  }
  if (action === 'duplicate') {
  }
  if (action === 're-activate') {
    router.push({ path: `booking/${e[0].id}`, query: { from: 'history', activated: true } })
  }
}
const removeBooking = async id => {
  await bookingsStore.deleteHistoryBooking(id)
  removeBookingDialog.value.show(false)
}
const onSelectRow = e => {
  router.push({ path: `booking/${e.id}`, query: { from: 'history' } })
}

onMounted(async () => {
  await bookingsStore.getBookingHistory()
  computedSearchedEntities.value = bookingsStore.bookings
})
const tableId = 'bookingsHistoryTable'
onMounted(() => {
  setTimeout(() => {
    const table = document.getElementById(tableId)
    tableHeight.value = smAndDown.value
      ? 396
      : window.innerHeight - table.getBoundingClientRect().top - 108
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
    <div class="flex justify-between items-center gap-5 mb-5">
      <Textfield
        v-model="searchValue"
        type="text"
        placeholder="Search..."
        prepend-inner-icon="mdi-magnify"
        clearable
        class="max-w-[280px] min-w-[160px]"
        @click:clear="onClearSearch"
      />
      <IconButton
        width="48"
        height="48"
        variant="outlined"
        class="ml-auto"
        :color="getColor('uiLine')"
      >
        <Icon
          icon="mdi-download"
          size="24"
          :color="getColor('iconButton-1')"
        />
        <Tooltip> Download datatable </Tooltip>
      </IconButton>
    </div>
    <VirtualTable
      :id="tableId"
      :key="tableId"
      :entities="computedSearchedEntities"
      :headers="bookingsHistoryHeaders"
      :loading="loading"
      :options="{
        rowHeight: 64,
        showActions: true,
        tableHeight: tableHeight,
        tableMinWidth: 960,
      }"
      class="mb-5"
      @onSelectRow="onSelectRow"
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
        <FlexTypography>
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
          <Highlighter
            v-if="searchValue"
            :query="searchValue"
          >
            {{ item.line.label }}
          </Highlighter>
          <template v-else>
            {{ item.line.label }}
          </template>
        </Typography>
      </template>
      <template #expiry="{ item }">
        <Typography>
          {{ getFormattedDateTime(item.bookingExpiry) }}
        </Typography>
      </template>
      <template #status="{ item }">
        <Classification
          type="status"
          :value="item.status === statuses.expired ? 'incomplete' : item.status"
        />
      </template>
      <template #truckers="{ item }">
        <div class="flex gap-2">
          <template v-for="scacList in item.scacList">
            <template
              v-for="scac in scacList"
              :key="scac"
            >
              <Chip>{{ scac }}</Chip>
            </template>
          </template>
        </div>
      </template>
      <template #actions="{ item, selected }">
        <template v-if="item.status === statuses.completed">
          <IconButton
            icon="mdi-delete"
            size="24"
            class="-mr-1.5"
            @click.stop="removeBookingDialog.show(true), (removeBookingDialog.data = item)"
          >
            <Tooltip> Remove booking </Tooltip>
          </IconButton>
        </template>
        <MenuActions
          v-else
          :actions="() => bookingHistoryActions(item)"
          :selected="selected"
          :container="item"
          @containerActionHandler="containerActionHandler"
        />
      </template>
    </VirtualTable>
  </div>
  <Dialog
    ref="removeBookingDialog"
    max-width="480"
  >
    <template #text>
      <RemoveCancelDialog
        btn-name="Remove"
        @close="removeBookingDialog.show(false)"
        @onClickBtn="removeBooking(removeBookingDialog.data.id)"
      >
        <Typography>
          Are you sure you want to remove ref#
          <b>{{ removeBookingDialog.data.ref }}</b>
          from your bookings?
        </Typography>
      </RemoveCancelDialog>
    </template>
  </Dialog>
</template>
