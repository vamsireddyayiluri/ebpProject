<script setup>
import { useActions, useHeaders, useDate } from '~/composables'
import { useCommitmentsStore } from '~/stores/commitments.store'
import { canceledCodes, declineCodes, onboardingCodes } from '~/constants/reasonCodes'
import { useBookingsStore } from '~/stores/bookings.store'

const props = defineProps({
  commitments: Array,
})
const {
  approveCommitment,
  declineCommitment,
  completeCommitment,
  cancelCommitment,
  edit_commitment_loadingDate,
} = useCommitmentsStore()
const bookingsStore = useBookingsStore()

const { getBooking } = useBookingsStore()
const { commitmentsHeaders } = useHeaders()
const { commitmentsActions } = useActions()
const commitmentStore = useCommitmentsStore()
const pendingCommitments = ref(props.commitments)
const showActions = ref(true)
const commitmentDetailsDialog = ref(null)
const completeCommitmentDialog = ref(null)
const cancelCommitmentDialog = ref(false)
const { getFormattedDate, getSmallerDate } = useDate()

const declineCommitmentDialog = ref(null)
const loadingDateDialog = ref(false)
const isloading = ref(false)
const loadCompleteCommitment = ref(false)

const completeReasonList = [
  onboardingCodes.onboarded,
  onboardingCodes.onboardMovedLoad,
  onboardingCodes.inComplete,
]
const cancelReasonList = [
  canceledCodes.capacityNotAvailable,
  canceledCodes.equipmentNotAvailable,
  canceledCodes.other,
]
const declineReasonList = [
  declineCodes.bookingCanceled,
  declineCodes.bookingRolled,
  declineCodes.tenderedElsewhere,
  declineCodes.other,
]
const emit = defineEmits(['close'])

const containerActionHandler = async ({ action, e }) => {
  if (action === 'view-trucker-details') {
    commitmentDetailsDialog.value.show(true)
    commitmentDetailsDialog.value.data = e[0]
  }
  if (action === 'approve-commitment') {
    await approveCommitment(e[0])
  }
  if (action === 'complete-commitment') {
    openCompleteCommitmentDialog(e[0])
  }
  if (action === 'update-loadingdate') {
    openLoadingDateDialog(e[0])
  }
  if (action === 'decline-commitment') {
    openDeclineCommitmentDialog(e[0].id)
  }
  if (action === 'cancel-commitment') {
    openCancelCommitmentDialog(e[0])
  }
}
const onApproveCommitment = async commitment => {
  commitmentDetailsDialog.value.show(false)
  await approveCommitment(commitment)
}
const openCompleteCommitmentDialog = commitment => {
  completeCommitmentDialog.value.show(true)
  completeCommitmentDialog.value.data = commitment
}
const openDeclineCommitmentDialog = id => {
  declineCommitmentDialog.value.show(true)
  declineCommitmentDialog.value.data = id
}
const openCancelCommitmentDialog = commiment => {
  cancelCommitmentDialog.value.show(true)
  cancelCommitmentDialog.value.data = commiment
}
const onCompleteCommitment = async (data, reason, onBoardedContainers) => {
  loadCompleteCommitment.value = true
  await completeCommitment(data, reason, onBoardedContainers)
  const index = pendingCommitments.value.findIndex(i => {
    return data.id === i.id
  })
  pendingCommitments.value.splice(index, 1)
  completeCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
  loadCompleteCommitment.value = false
  emit('close', pendingCommitments.value.length > 0)
}
const openLoadingDateDialog = async commitment => {
  const booking = await getBooking({ id: commitment.bookingId })
  loadingDateDialog.value.show(true)
  loadingDateDialog.value.data = commitment
  loadingDateDialog.value.data.createdAt = new Date(booking.createdAt)
}
const onCancelCommitment = async (commiment, reason) => {
  cancelCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
  await cancelCommitment(commiment, reason)
  const index = pendingCommitments.value.findIndex(i => {
    return commiment.id === i.id
  })
  pendingCommitments.value.splice(index, 1)
  emit('close', pendingCommitments.value.length > 0)
}
const onDeclineCommitment = async reason => {
  declineCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
  await declineCommitment(declineCommitmentDialog.value.data, reason)
}
const onLoadingDateUpdated = async (data, loadingDate, newCommitted) => {
  isloading.value = true
  const updatedCommitment = await edit_commitment_loadingDate(data, loadingDate, newCommitted)
  const index = pendingCommitments.value.findIndex(i => {
    return data.id === i.id
  })
  pendingCommitments.value.splice(index, 1)

  if (updatedCommitment) {
    pendingCommitments.value.push(updatedCommitment)
  }
  loadingDateDialog.value.show(false)
  emit('close', pendingCommitments.value.length > 0)

  isloading.value = false
}
</script>

<template>
  <VirtualTable
    :entities="pendingCommitments"
    :headers="commitmentsHeaders"
    :options="{
      rowHeight: 64,
      showActions,
      tableHeight: 575,
      tableMinWidth: 640,
    }"
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
        :actions="() => commitmentsActions(item.status, 'active')"
        :selected="selected"
        :container="item"
        @containerActionHandler="containerActionHandler"
      />
    </template>
  </VirtualTable>
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
    ref="loadingDateDialog"
    max-width="480"
  >
    <template #text>
      <UpdateLoadingDateDialog
        :sub-title="`Edit loading date for ${loadingDateDialog.data.truckerCompany}`"
        btn-name="Update"
        :loading="isloading"
        :loadingDate="loadingDateDialog.data.loadingDate"
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
