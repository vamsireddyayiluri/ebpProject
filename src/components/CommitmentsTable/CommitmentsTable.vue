<script setup>
import { useActions, useHeaders } from '~/composables'
import { useCommitmentsStore } from '~/stores/commitments.store'
import { declineCodes, onboardingCodes } from '~/constants/reasonCodes'

const props = defineProps({
  commitments: Array,
})
const { approveCommitment, declineCommitment, completeCommitment } = useCommitmentsStore()
const { commitmentsHeaders } = useHeaders()
const { commitmentsActions } = useActions()

const showActions = ref(true)
const commitmentDetailsDialog = ref(null)
const completeCommitmentDialog = ref(null)
const declineCommitmentDialog = ref(null)
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

const containerActionHandler = async ({ action, e }) => {
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
const onCompleteCommitment = async (id, reason) => {
  await completeCommitment(id, reason)
  completeCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
}
const onDeclineCommitment = async reason => {
  declineCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
  await declineCommitment(declineCommitmentDialog.value.data, reason)
}
</script>

<template>
  <VirtualTable
    :entities="commitments"
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
    <template #status="{ item }">
      <Classification
        type="status"
        :value="item.status"
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
