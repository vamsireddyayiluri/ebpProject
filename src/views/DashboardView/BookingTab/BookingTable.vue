<script setup>
import { useActions, useDate, useHeaders } from '~/composables'
import { getLineAvatar } from '~/firebase/getLineAvatar'
import { useDisplay } from 'vuetify'
import { getBookingLoad } from '~/helpers/countings'
import { useBookingsStore } from '~/stores/bookings.store'
import { useAuthStore } from '~/stores/auth.store'
import { useCommitmentsStore } from '~/stores/commitments.store'
import { reasonCodes } from '~/constants/reasonCodes'
import { statuses } from '~/constants/statuses'

const props = defineProps({
  computedEntities: Array,
  searchValue: String,
  loading: Boolean,
})
const emit = defineEmits(['selectTableRow', 'editBooking'])
const { deleteBooking, updateBookingStatus } = useBookingsStore()
const { approveCommitment, completeCommitment, declineCommitment } = useCommitmentsStore()
const { userData } = useAuthStore()
const { smAndDown } = useDisplay()
const showActions = ref(true)
const tableHeight = ref(0)
const removeBookingDialog = ref(false)
const completeCommitmentDialog = ref(false)
const completeReasonList = [
  reasonCodes.onboarded,
  reasonCodes.onboardMovedLoad,
  reasonCodes.neverOnboarded,
  reasonCodes.other,
]

const { bookingsHeaders, commitmentsHeaders } = useHeaders()
const { bookingsActions, commitmentsActions } = useActions()
const { getFormattedDateTime } = useDate()
const commitmentDetailsDialog = ref(null)

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
    await approveCommitment(e[0].id)
  }
  if (action === 'complete-commitment') {
    openCompleteCommitmentDialog(e[0].id)
  }
  if (action === 'decline-commitment') {
    await declineCommitment(e[0].id)
  }
}
const onSelectRow = e => {
  emit('selectTableRow', e)
}
const onApproveCommitment = async id => {
  commitmentDetailsDialog.value.show(false)
  await approveCommitment(id)
}
const openCompleteCommitmentDialog = id => {
  completeCommitmentDialog.value.show(true)
  completeCommitmentDialog.value.data = id
}
const onDeclineCommitment = async id => {
  commitmentDetailsDialog.value.show(false)
  await declineCommitment(id)
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
    <template #status="{ item }">
      <Classification
        type="status"
        :value="item.status"
      />
    </template>
    <template #expiry="{ item }">
      <Typography type="text-body-m-regular">
        {{ getFormattedDateTime(item.bookingExpiry) }}
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
        :actions="() => bookingsActions(item.status)"
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
            :actions="() => commitmentsActions(item.status)"
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
    ref="commitmentDetailsDialog"
    max-width="980"
  >
    <template #text>
      <CommitmentDetailsDialog
        :commitment="commitmentDetailsDialog.data"
        @approveCommitment="onApproveCommitment"
        @completeCommitment="openCompleteCommitmentDialog"
        @declineCommitment="onDeclineCommitment"
        @close="commitmentDetailsDialog.show(false)"
      />
    </template>
  </Dialog>
</template>
