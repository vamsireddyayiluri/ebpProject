<script setup>
import { useActions, useDate, useHeaders } from '~/composables'
import { getLineAvatar } from '~/firebase/getLineAvatar'
import { useDisplay } from 'vuetify'
import { getBookingLoad } from '~/helpers/countings'

const props = defineProps({
  computedEntities: Array,
  searchValue: String,
  loading: Boolean,
})
const emit = defineEmits(['selectTableRow', 'editBooking'])
const { smAndDown } = useDisplay()
const showActions = ref(true)
const tableHeight = ref(0)
const removeBookingDialog = ref(false)
const selectedBooking = ref(null)

const { bookingsHeaders } = useHeaders()
const { bookingsActions } = useActions()
const formatDate = useDate()

const containerActionHandler = ({ action, e }) => {
  if (action === 'edit-booking') emit('editBooking', e[0].ref)
  if (action === 'remove-booking') removeBookingDialog.value.show(true), (selectedBooking.value = e)
}

const onSelectRow = e => {
  emit('selectTableRow', e)
}
const tableId = 'bookingsTable'
onMounted(() => {
  setTimeout(() => {
    const table = document.getElementById(tableId)
    tableHeight.value = smAndDown.value
      ? 396
      : window.innerHeight - table.getBoundingClientRect().top - 95
  })
})
</script>

<template>
  <VirtualTable
    :id="tableId"
    key="bookings"
    :entities="computedEntities"
    :headers="bookingsHeaders"
    :loading="loading"
    :options="{
      rowHeight: 64,
      showActions,
      tableHeight: tableHeight,
      tableMinWidth: 960,
    }"
    class="mb-5"
    @onSelectRow="onSelectRow"
  >
    <template #ref="{ item }">
      <Typography type="text-body-m-regular">
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
      <Typography type="text-body-m-regular">
        {{ item.location.label }}
      </Typography>
    </template>
    <template #ssl="{ item }">
      <img
        :src="getLineAvatar(item.line.id)"
        :alt="item.line.label"
        class="h-8"
      >
    </template>
    <template #expiry="{ item }">
      <Typography type="text-body-m-regular">
        {{ formatDate(item.expiryDate) }}
      </Typography>
    </template>
    <template #location="{ item }">
      <LocationChip :location="item?.location" />
    </template>
    <template #progress="{ item }">
      <ProgressLinear :value="getBookingLoad(item.booked, item.amount)">
        {{ getBookingLoad(item.booked, item.amount) }}%
      </ProgressLinear>
    </template>

    <template #actions="{ item, selected }">
      <MenuActions
        :actions="bookingsActions"
        :selected="selected"
        :container="item"
        @containerActionHandler="containerActionHandler"
      />
    </template>
  </VirtualTable>

  <Dialog
    ref="removeBookingDialog"
    max-width="480"
  >
    <template #text>
      <RemoveCancelDialog
        btn-name="Remove"
        @close="removeBookingDialog.show(false)"
        @onClickBtn="removeBookingDialog.show(false)"
      >
        <Typography>
          Are you sure you want to remove ref#
          <b>{{ selectedBooking[0].ref }}</b>
          from your bookings?
        </Typography>
      </RemoveCancelDialog>
    </template>
  </Dialog>
</template>
