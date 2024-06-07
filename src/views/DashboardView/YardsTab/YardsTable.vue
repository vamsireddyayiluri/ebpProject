<script setup>
import { useActions, useHeaders } from '~/composables'
import { useDisplay } from 'vuetify'
import { getBookingLoad, getYardBookingLoad } from '~/helpers/countings'
import { useBookingsStore } from '~/stores/bookings.store'
import { useAuthStore } from '~/stores/auth.store'
import { statuses } from '~/constants/statuses'
import { useCommitmentsStore } from '~/stores/commitments.store'
import { getLocalTime } from '@qualle-admin/qutil/dist/date'
import { declineCodes } from '~/constants/reasonCodes'

const props = defineProps({
  computedEntities: Array,
  searchValue: String,
  loading: Boolean,
})
const emit = defineEmits(['selectTableRow', 'editBooking', 'duplicateBooking'])
const { userData } = useAuthStore()
const { deleteBooking, updateBookingStatus } = useBookingsStore()
const commitmentStore = useCommitmentsStore()
const { smAndDown, width } = useDisplay()
const showActions = ref(true)
const tableHeight = ref(1)
const removeBookingDialog = ref(false)
const cancelBookingDialog = ref(false)

const bookingConfirmationDialog = ref(null)

const { yardsHeaders, bookingsHeaders } = useHeaders()
const { bookingsActions } = useActions()
const confirmClickedOutside = ref(null)
const declineReasonList = [
  declineCodes.bookingCanceled,
  declineCodes.bookingRolled,
  declineCodes.tenderedElsewhere,
  declineCodes.other,
]
const containerActionHandler = async ({ action, e }) => {
  props.computedEntities.find(yard => yard.id === e[0].location.geohash).expand = true

  let validActions = false
  const details = e[0]?.details
  const filteredDetails = details?.filter(obj => {
    return obj.loadingDate >= getLocalTime().format()
  })
  if (filteredDetails?.length > 0) {
    const commitmentsList = await commitmentStore.getExpiredCommitments(e[0].location.geohash)
    if (commitmentsList?.length) {
      bookingConfirmationDialog.value.show(true)
      bookingConfirmationDialog.value.data = commitmentsList
    } else {
      validActions = true
    }
  } else {
    validActions = true
  }
  if (validActions) {
    if (action === 'edit-booking') emit('editBooking', e[0].id)
    if (action === 'remove-booking') {
      removeBookingDialog.value.data = e[0]
      removeBookingDialog.value.show(true)
    }
    if (action === 'pause-booking') {
      await updateBookingStatus(e[0], statuses.paused)
    }
    if (action === 'reactive-booking') {
      await updateBookingStatus(e[0], statuses.active)
    }
    if (action === 'duplicate-booking') {
      emit('duplicateBooking', e[0].ids)
    }
    if (action === 'cancel-booking') {
      openCancelBookingDialog(e[0])
    }
  }
}
const onSelectRow = e => {
  emit('selectTableRow', e)
}
const openCancelBookingDialog = booking => {
  cancelBookingDialog.value.show(true)
  cancelBookingDialog.value.data = booking
}
const removeBooking = booking => {
  deleteBooking(booking.ids)
  removeBookingDialog.value.show(false)
}
const onCancelBooking = async (booking, reason) => {
  await updateBookingStatus(booking, statuses.canceled, reason)
  cancelBookingDialog.value.show(false)
}
const closeConfirmBookingDialog = (isPending = false) => {
  if (!isPending) {
    bookingConfirmationDialog.value.show(false)
    bookingConfirmationDialog.value.data = null
  }
}
const onClickOutsideDialog = () => {
  confirmClickedOutside.value = true
  closeConfirmBookingDialog()
  setInterval(() => {
    confirmClickedOutside.value = false
  }, 1000)
}
const tableId = 'yardsTable'
onMounted(() => {
  setTimeout(() => {
    const table = document.getElementById(tableId)
    tableHeight.value = smAndDown.value
      ? '396px'
      : window.innerHeight - table.getBoundingClientRect().top - 108 + 'px'
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
      tableMinWidth: 960,
      expansionRow: true,
    }"
    @onSelectRow="onSelectRow"
  >
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
        :headers="bookingsHeaders(userData.type)"
        :options="{
          rowHeight: 64,
          showActions,
          tableMinWidth: 640,
        }"
        class="pl-16"
      >
        <template #ref="{ item }">
          <FlexTypography type="text-body-m-regular">
            <Highlighter
              v-if="searchValue"
              :query="searchValue"
            >
              {{ item.ref }}
            </Highlighter>
            <template v-else>
              {{ item.ref }}
            </template>
          </FlexTypography>
        </template>
        <template #containers="{ item }">
          <Typography> {{ item.committed }}/{{ item.containers }}</Typography>
        </template>
        <template #yardLabel="{ item }">
          <FlexTypography type="text-body-m-regular">
            {{ item.location.label || '--' }}
          </FlexTypography>
        </template>
        <template #ssl="{ item }">
          <LineAvatar :line="item.line" />
        </template>
        <template #size="{ item }">
          <SizeColumn :data="item" />
        </template>
        <template #status="{ item }">
          <Classification
            type="status"
            :value="item.status"
          />
        </template>
        <template #bookingExpiry="{ item }">
          <BookingLoadingDateColumn :data="item" />
        </template>
        <template #location="{ item }">
          <LocationChip :location="item?.location" />
        </template>
        <template #worker="{ item }">
          <Typography>
            {{ item.createdBy?.name || '--' }}
          </Typography>
        </template>
        <template #progress="{ item }">
          <ProgressLinear :value="getBookingLoad(item.committed, item.containers)">
            {{ getBookingLoad(item.committed, item.containers) }}%
          </ProgressLinear>
        </template>
        <template #actions="{ item, selected }">
          <MenuActions
            :disabled="bookingsActions(item).length > 0 ? false : true"
            :actions="() => bookingsActions(item)"
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
      <ConfirmationDialog
        btn-name="Remove"
        @close="removeBookingDialog.show(false)"
        @onClickBtn="removeBooking(removeBookingDialog.data)"
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
    ref="bookingConfirmationDialog"
    class="max-w-full sm:max-w-[90vw] md:max-w-[75vw]"
    @update:modelValue="onClickOutsideDialog"
  >
    <template #text>
      <BookingConfirmationDialog
        :commitments="bookingConfirmationDialog.data"
        :clicked-outside="confirmClickedOutside"
        @close="closeConfirmBookingDialog"
        @checkPending="e => closeConfirmBookingDialog(e)"
      />
    </template>
  </Dialog>
  <Dialog
    ref="cancelBookingDialog"
    max-width="480"
  >
    <template #text>
      <ReportIssueDialog
        title="Cancel booking"
        sub-title="Choose the reason why you want to cancel booking"
        select-label="Select"
        :reason-list="declineReasonList"
        btn-name="cancel"
        @close="cancelBookingDialog.show(false)"
        @onClickBtn="e => onCancelBooking(cancelBookingDialog.data, e)"
      />
    </template>
  </Dialog>
</template>

<style lang="scss">
#yardsTable.virtual-table-wrapper {
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
