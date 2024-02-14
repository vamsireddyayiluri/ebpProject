<script setup>
import { useActions, useDate, useHeaders } from '~/composables'
import { useDisplay } from 'vuetify'
import { getBookingLoad } from '~/helpers/countings'
import { useBookingsStore } from '~/stores/bookings.store'
import { useAuthStore } from '~/stores/auth.store'
import { useCommitmentsStore } from '~/stores/commitments.store'
import { declineCodes, onboardingCodes } from '~/constants/reasonCodes'
import { statuses } from '~/constants/statuses'

const props = defineProps({
  computedEntities: Array,
  searchValue: String,
  loading: Boolean,
})
const emit = defineEmits(['selectTableRow', 'editBooking'])
const {
  deleteBooking,
  pauseBooking,
  createDraft,
  updateBookingStatus,
  getCommitmentsByBookingId,
  closeBookingExpansion,
} = useBookingsStore()
const { approveCommitment, declineCommitment, completeCommitment } = useCommitmentsStore()
const { computedEntities } = toRefs(props)
const { userData } = useAuthStore()
const { smAndDown } = useDisplay()
const showActions = ref(true)
const tableHeight = ref(0)
const removeBookingDialog = ref(false)
const completeCommitmentDialog = ref(false)
const declineCommitmentDialog = ref(false)
const completeReasonList = [
  onboardingCodes.onboarded,
  onboardingCodes.onboardMovedLoad,
  onboardingCodes.neverOnboarded,
  onboardingCodes.other,
]
const declineReasonList = [
  declineCodes.bookingCanceled,
  declineCodes.bookingRolled,
  declineCodes.tenderedElsewhere,
  declineCodes.other,
]
const { bookingsHeaders, commitmentsHeaders } = useHeaders()
const { bookingsActions, commitmentsActions } = useActions()
const { getFormattedDateTime, getFormattedDate } = useDate()
const commitmentDetailsDialog = ref(null)
const bookingStatus = id => {
  const bookings = computedEntities.value
  const booking = bookings.find(i => i.id === id)

  return booking.status
}
const containerActionHandler = async ({ action, e }) => {
  if (action === 'edit-booking') emit('editBooking', e[0].id)
  if (action === 'remove-booking') {
    removeBookingDialog.value.show(true)
    removeBookingDialog.value.data = e[0]
  }
  if (action === 'pause-booking') {
    await updateBookingStatus(e[0].id, statuses.paused)
  }
  if (action === 'reactive-booking') {
    await updateBookingStatus(e[0].id, statuses.active)
  }
  if (action === 'view-trucker-details') {
    commitmentDetailsDialog.value.show(true)
    commitmentDetailsDialog.value.data = e[0]
  }
  if (action === 'approve-commitment') {
    await approveCommitment(e[0])
  }
  if (action === 'complete-commitment') {
    openCompleteCommitmentDialog(e[0].id)
  }
  if (action === 'decline-commitment') {
    openDeclineCommitmentDialog(e[0].id)
  }
}
const onSelectRow = e => {
  emit('selectTableRow', e)
}
const rowExpanded = async (event, data) => {
  const { id } = toRaw(data.value)
  if (event) {
    await getCommitmentsByBookingId(id)
  } else {
    await closeBookingExpansion(id)
  }
}
const onApproveCommitment = async commitment => {
  commitmentDetailsDialog.value.show(false)
  await approveCommitment(commitment)
}
const openCompleteCommitmentDialog = id => {
  completeCommitmentDialog.value.show(true)
  completeCommitmentDialog.value.data = id
}
const openDeclineCommitmentDialog = id => {
  declineCommitmentDialog.value.show(true)
  declineCommitmentDialog.value.data = id
}
const removeBooking = id => {
  deleteBooking(id)
  removeBookingDialog.value.show(false)
}
const onCompleteCommitment = async (id, reason) => {
  await completeCommitment(id, reason)
  completeCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
}
const onDeclineCommitment = async (id, reason) => {
  declineCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
  await declineCommitment(id, reason)
}
const tableId = 'bookingsTable'
onMounted(() => {
  setTimeout(() => {
    const table = document.getElementById(tableId)
    tableHeight.value = smAndDown.value
      ? 396
      : window.innerHeight - table.getBoundingClientRect().top - 108
  })
})
</script>

<template>
  <VirtualTable
    :id="tableId"
    key="bookings"
    :entities="computedEntities"
    :headers="bookingsHeaders(userData.type)"
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
      <Typography> {{ item.committed }}/{{ item.containers }} </Typography>
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
      <Typography>
        <template v-if="item.flexibleBooking">
          <template
            v-for="i in item.size"
            :key="i"
          >
            {{ i }}
            <br>
          </template>
        </template>
        <template v-else>
          {{ item.size }}
        </template>
      </Typography>
    </template>
    <template #status="{ item }">
      <Classification
        type="status"
        :value="item.status"
      />
    </template>
    <template #bookingExpiry="{ item }">
      <Typography type="text-body-m-regular">
        {{ getFormattedDate(item.bookingExpiry) }}
        <Tooltip>
          {{ getFormattedDateTime(item.bookingExpiry) }}
        </Tooltip>
      </Typography>
    </template>
    <template #location="{ item }">
      <LocationChip :location="item?.location" />
    </template>
    <template #worker="{ item }">
      <Typography>
        {{ item.createdBy.fullName }}
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
        class="pl-16"
      >
        <template #trucker="{ item }">
          <Typography>
            {{ item.scac }}
          </Typography>
        </template>
        <template #committed="{ item }">
          <Typography>
            {{ item.committed }}
          </Typography>
        </template>
        <template #status="{ item }">
          <Classification
            type="status"
            :value="item.status"
          />
        </template>
        <template #actions="{ item, selected }">
          <MenuActions
            :actions="() => commitmentsActions(item.status, bookingStatus(item.bookingId))"
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
  <Dialog
    ref="completeCommitmentDialog"
    max-width="480"
  >
    <template #text>
      <CompleteCommitmentsDialog
        title="Complete commitment"
        sub-title="Did you onboard and work with halo lab delivery successfully?"
        select-label="Select"
        :reason-list="completeReasonList"
        btn-name="confirm"
        @close="completeCommitmentDialog.show(false)"
        @onClickBtn="e => onCompleteCommitment(completeCommitmentDialog.data, e)"
      />
    </template>
  </Dialog>
  <Dialog
    ref="declineCommitmentDialog"
    max-width="480"
  >
    <template #text>
      <CompleteCommitmentsDialog
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
  <Dialog
    ref="commitmentDetailsDialog"
    max-width="980"
  >
    <template #text>
      <CommitmentDetailsDialog
        :commitment="commitmentDetailsDialog.data"
        @approveCommitment="onApproveCommitment"
        @completeCommitment="openCompleteCommitmentDialog"
        @declineCommitment="openDeclineCommitmentDialog"
        @close="commitmentDetailsDialog.show(false)"
      />
    </template>
  </Dialog>
</template>
