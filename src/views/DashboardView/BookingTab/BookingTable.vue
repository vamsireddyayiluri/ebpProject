<script setup>
import { useActions, useDate, useHeaders } from '~/composables'
import { useDisplay } from 'vuetify'
import { getBookingLoad } from '~/helpers/countings'
import { useBookingsStore } from '~/stores/bookings.store'
import { useAuthStore } from '~/stores/auth.store'
import { useCommitmentsStore } from '~/stores/commitments.store'
import { canceledCodes, declineCodes } from '~/constants/reasonCodes'
import { statuses } from '~/constants/statuses'
import { getLocalTime } from '@qualle-admin/qutil/dist/date'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '~/stores/notification.store'

const props = defineProps({
  computedEntities: Array,
  searchValue: String,
  loading: Boolean,
})

const emit = defineEmits([
  'selectTableRow',
  'editBooking',
  'duplicateBooking',
  'openCommitmentDetails',
  'openApproveCommitment',
  'openCompleteCommitment',
  'openDeclineCommitment',
])

const bookingsStore = useBookingsStore()

const {
  removeFromNetwork,
  updateBookingStatus,
  getCommitmentsByBookingId,
  closeBookingExpansion,
  getBooking,
} = useBookingsStore()
const {
  approveCommitment,
  declineCommitment,
  cancelCommitment,
  completeCommitment,
  edit_commitment_loadingDate,
} = useCommitmentsStore()
const commitmentStore = useCommitmentsStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const { liveCommitments } = storeToRefs(notificationStore)
const { smAndDown } = useDisplay()
const router = useRouter()
const showActions = ref(true)
const tableHeight = ref('auto')
const bookingConfirmationDialog = ref(null)
const removeBookingDialog = ref(false)
const cancelBookingDialog = ref(false)
const loadingDateDialog = ref(false)
const cancelCommitmentDialog = ref(false)
const isloading = ref(false)
const confirmClickedOutside = ref(null)

const declineReasonList = [
  declineCodes.bookingCanceled,
  declineCodes.bookingRolled,
  declineCodes.tenderedElsewhere,
  declineCodes.other,
]
const cancelReasonList = [
  canceledCodes.capacityNotAvailable,
  canceledCodes.equipmentNotAvailable,
  canceledCodes.other,
]
const { bookingsHeaders, commitmentsHeaders } = useHeaders()
const { bookingsActions, commitmentsActions } = useActions()
const { getFormattedDate } = useDate()
const notGroupedBookings = computed(() => bookingsStore.notGroupedBookings)
const bookingStatus = item => {
  const bookings = notGroupedBookings.value
  const booking = bookings.find(i => i.id === item.bookingId)

  return booking?.status
}
const containerActionHandler = async ({ action, e }) => {
  let validActions = false
  let fromCommitment = false
  let filteredArray = []
  if (e[0].bookingId) {
    fromCommitment = e[0].loadingDate >= getLocalTime().format()
  } else {
    const details = e[0].details
    filteredArray = details.filter(obj => {
      return obj.loadingDate >= getLocalTime().format()
    })
  }
  if (filteredArray.length > 0 || fromCommitment) {
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
      removeBookingDialog.value.show(true)
      removeBookingDialog.value.data = e[0]
    }
    if (action === 'cancel-booking') {
      openCancelBookingDialog(e[0])
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
    if (action === 'view-trucker-details') {
      emit('openCommitmentDetails', e[0])
    }
    if (action === 'approve-commitment') {
      emit('openApproveCommitment', e[0])
    }
    if (action === 'complete-commitment') {
      emit('openCompleteCommitment', e[0])
    }
    if (action === 'update-loadingdate') {
      openLoadingDateDialog(e[0])
    }
    if (action === 'decline-commitment') {
      emit('openDeclineCommitment', e[0])
    }
    if (action === 'cancel-commitment') {
      openCancelCommitmentDialog(e[0])
    }
  }
}
const onSelectRow = e => {
  emit('selectTableRow', e)
}
const rowExpanded = async (event, data) => {
  const { ids, id } = toRaw(data.value)
  if (event) {
    await getCommitmentsByBookingId(id, ids)
  } else {
    await closeBookingExpansion(id)
  }
}
const openCancelBookingDialog = booking => {
  cancelBookingDialog.value.show(true)
  cancelBookingDialog.value.data = booking
}
const openLoadingDateDialog = async commitment => {
  const booking = await getBooking({ id: commitment.bookingId })
  loadingDateDialog.value.show(true)
  loadingDateDialog.value.data = commitment
  loadingDateDialog.value.data.createdAt = new Date(booking.createdAt)
}
const openCancelCommitmentDialog = commiment => {
  cancelCommitmentDialog.value.show(true)
  cancelCommitmentDialog.value.data = commiment
}
const removeBooking = async booking => {
  await removeFromNetwork(booking)
  removeBookingDialog.value.show(false)
}
const onCancelBooking = async (booking, reason) => {
  await updateBookingStatus(booking, statuses.canceled, reason)
  cancelBookingDialog.value.show(false)
}
const onLoadingDateUpdated = async (data, loadingDate, newCommitted) => {
  isloading.value = true
  await edit_commitment_loadingDate(data, loadingDate, newCommitted)
  loadingDateDialog.value.show(false)
  isloading.value = false
}

const onCancelCommitment = async (commitment, reason) => {
  cancelCommitmentDialog.value.show(false)
  await cancelCommitment(commitment, reason)
}
const tableId = 'bookingsTable'
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
onMounted(async () => {
  setTimeout(() => {
    tableHeight.value = smAndDown.value ? 396 : liveCommitments.value.length ? 439 : 523
  }, 1000)
})
</script>

<template>
  <VirtualTable
    :id="tableId"
    key="bookings"
    :entities="computedEntities"
    :headers="bookingsHeaders(authStore.userData?.type)"
    :loading="loading"
    :options="{
      rowHeight: 64,
      showActions,
      tableHeight: tableHeight,
      tableMinWidth: 960,
      expansionRow: true,
    }"
    @onSelectRow="onSelectRow"
    @onRowExpanded="rowExpanded"
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
        :value="item.status.replace('_', ' ')"
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
        :disabled="bookingsActions(item).length <= 0"
        :actions="() => bookingsActions(item)"
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
          showActions,
          tableHeight: 575,
          tableMinWidth: 640,
        }"
        class="pl-16 commitmentsTable"
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
            :actions="() => commitmentsActions(item.status, bookingStatus(item))"
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
    ref="cancelBookingDialog"
    max-width="480"
  >
    <template #text>
      <ReportIssueDialog
        title="Cancel booking"
        sub-title="Choose the reason why you want to cancel booking"
        select-label="Select"
        :reason-list="declineReasonList"
        btn-name="confirm cancelation"
        @close="cancelBookingDialog.show(false)"
        @onClickBtn="e => onCancelBooking(cancelBookingDialog.data, e)"
      />
    </template>
  </Dialog>
  <Dialog
    ref="loadingDateDialog"
    max-width="480"
  >
    <template #text>
      <UpdateLoadingDateDialog
        :sub-title="`Edit loading date for ${loadingDateDialog.data.truckerCompany}`"
        btn-name="Update"
        :loading="isloading"
        :loading-date="loadingDateDialog.data.loadingDate"
        :committed="loadingDateDialog.data.committed"
        :createdAt="loadingDateDialog.data.createdAt"
        @close="loadingDateDialog.show(false)"
        @onClickUpdate="
          (loadingDate, newCommitted) =>
            onLoadingDateUpdated(loadingDateDialog.data, loadingDate, newCommitted)
        "
      />
    </template>
  </Dialog>
  <Dialog
    ref="cancelCommitmentDialog"
    max-width="480"
  >
    <template #text>
      <ReportIssueDialog
        title="Cancel commitment"
        sub-title="Choose the reason why you want to cancel commitment"
        select-label="Select"
        :reason-list="cancelReasonList"
        btn-name="confirm cancelation"
        @close="cancelCommitmentDialog.show(false)"
        @onClickBtn="e => onCancelCommitment(cancelCommitmentDialog.data, e)"
      />
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
</template>
