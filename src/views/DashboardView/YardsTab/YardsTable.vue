<script setup>
import { useActions, useDate, useHeaders } from '~/composables'
import { getLineAvatar } from '~/firebase/getLineAvatar'
import { useDisplay } from 'vuetify'
import { getYardBookingLoad, getBookingLoad } from '~/helpers/countings'

const props = defineProps({
  computedEntities: Array,
  searchValue: String,
  loading: Boolean,
})
const emit = defineEmits(['selectTableRow', 'editBooking'])

const { smAndDown, width } = useDisplay()
const showActions = ref(true)
const tableHeight = ref(1)
const removeBookingDialog = ref(false)

const { yardsHeaders, bookingsHeaders } = useHeaders()
const { bookingsActions } = useActions()
const formatDate = useDate()

const containerActionHandler = ({ action, e }) => {
  if (action === 'edit-booking') emit('editBooking', e[0].ref)
  if (action === 'remove-booking') {
    removeBookingDialog.value.show(true)
    removeBookingDialog.value.data = e[0]
  }
}

const onSelectRow = e => {
  emit('selectTableRow', e)
}

const tableId = 'yardsTable'
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
    :entities="computedEntities"
    :headers="yardsHeaders"
    :loading="loading"
    :options="{
      rowHeight: 64,
      tableHeight: tableHeight,
      tableMinWidth: 960,
      expansionRow: true,
    }"
    class="mb-5"
    @onSelectRow="onSelectRow"
  >
    <template #yardLabel="{ item }">
      <Typography type="text-body-m-regular">
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
    <template #location="{ item }">
      <Typography type="text-body-m-regular">
        <Highlighter
          v-if="searchValue"
          :query="searchValue"
        >
          {{ item.location.address }}
        </Highlighter>
        <template v-else>
          {{ item.location.address }}
        </template>
      </Typography>
    </template>
    <template #progress="{ item }">
      <ProgressLinear :value="getYardBookingLoad(item.entities).rate">
        {{ getYardBookingLoad(item.entities).rate }}%
      </ProgressLinear>
    </template>
    <template #expansion="{ item }">
      <VirtualTable
        :entities="item.entities"
        :headers="bookingsHeaders"
        :options="{
          rowHeight: 64,
          showActions,
          tableHeight: 575,
          tableMinWidth: 640,
        }"
        class="pl-16"
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
            {{ item.location.label || '--' }}
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
          <b>{{ removeBookingDialog.data.ref }}</b>
          from your bookings?
        </Typography>
      </RemoveCancelDialog>
    </template>
  </Dialog>
</template>

<style lang="scss"></style>
