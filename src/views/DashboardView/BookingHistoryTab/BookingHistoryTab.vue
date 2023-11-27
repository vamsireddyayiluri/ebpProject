<script setup>
import truckersData from '~/fixtures/truckers.json'
import { useDisplay } from 'vuetify'
import {useActions, useDate, useHeaders} from '~/composables'
import { getColor } from '~/helpers/colors'
import {useBookingHistoryStore} from "~/stores/bookingHistory.store"
import {storeToRefs} from "pinia"

const bookingsStore = useBookingHistoryStore()
const { bookings } = storeToRefs(bookingsStore)
const { smAndDown } = useDisplay()
const { bookingsHistoryHeaders } = useHeaders()
const { bookingHistoryActions } = useActions()
const { getFormattedDateTime } = useDate()
const router = useRouter()
const statistics = ref(truckersData)
const tableHeight = ref(0)
const searchValue = ref(null)
const loading = ref(false)
const computedSearchedEntities = ref(bookings.value)
const removeBookingDialog = ref(null)

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
      ({ ref, line: {label}, location: {label: address} }) =>
        useArraySome(
          useArrayMap(Object.values({ ref, label, address }), value => String(value).toLowerCase()).value,
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
  if (action === 'duplicate') {}
  if (action === 're-activate') {}
}
const removeBooking = id => {
  bookingsStore.deleteBooking(id)
  removeBookingDialog.value.show(false)
}
const onSelectRow = e => {
  router.push({ path: `booking/${e.id}`, state: { from: 'history' }})
}

const tableId = 'bookingsHistoryTable'
onMounted(() => {
  setTimeout(() => {
    const table = document.getElementById(tableId)
    tableHeight.value = smAndDown.value
      ? 396
      : window.innerHeight - table.getBoundingClientRect().top - 95
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
        <Tooltip location="top">
          Download datatable
        </Tooltip>
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
        <Typography>
          <Highlighter
            v-if="searchValue"
            :query="searchValue"
          >
            {{ item.location.label }}
          </Highlighter>
          <template v-else>
            {{ item.location.label || '--' }}
          </template>
        </Typography>
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
          {{ getFormattedDateTime(item.expiryDate) }}
        </Typography>
      </template>
      <template #status="{ item }">
        <Classification
          type="status"
          :value="item.status === 'expired'? 'incomplete': item.status"
        />
      </template>
      <template #truckers="{ item }">
        <div class="flex gap-2">
          <template
            v-for="i in item.carriers"
            :key="i.scac"
          >
            <Chip>{{ i.scac }}</Chip>
          </template>
        </div>
      </template>
      <template #actions="{ item, selected }">
        <MenuActions
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
