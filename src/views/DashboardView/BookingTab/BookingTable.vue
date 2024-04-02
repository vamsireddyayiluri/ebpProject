<script setup>
import { useActions, useDate, useHeaders } from '~/composables'
import { useDisplay } from 'vuetify'
import { getBookingLoad } from '~/helpers/countings'
import { useBookingsStore } from '~/stores/bookings.store'
import { useAuthStore } from '~/stores/auth.store'
import { useCommitmentsStore } from '~/stores/commitments.store'
import { canceledCodes, declineCodes, onboardingCodes } from '~/constants/reasonCodes'
import { statuses } from '~/constants/statuses'
import { handleQueryUrlForCommitments } from '~/helpers/links'
const props = defineProps({
  computedEntities: Array,
  searchValue: String,
  loading: Boolean,
})

const emit = defineEmits(['selectTableRow', 'editBooking', 'duplicateBooking'])

const bookingsStore = useBookingsStore()

const { deleteBooking, updateBookingStatus, getCommitmentsByBookingId, closeBookingExpansion } =
  useBookingsStore()
const {
  approveCommitment,
  declineCommitment,
  cancelCommitment,
  completeCommitment,
  edit_commitment_loadingDate,
} = useCommitmentsStore()

// const { computedEntities } = toRefs(props)
const authStore = useAuthStore()
const { smAndDown } = useDisplay()
const router = useRouter()
const showActions = ref(true)
const tableHeight = ref(0)
const removeBookingDialog = ref(false)
const cancelBookingDialog = ref(false)
const approveCommitmentDialog = ref(false)
const completeCommitmentDialog = ref(false)
const declineCommitmentDialog = ref(false)
const loadingDateDialog = ref(false)
const cancelCommitmentDialog = ref(false)
const loadCompleteCommitment = ref(false)
const isloading = ref(false)
const completeReasonList = [
  onboardingCodes.onboarded,
  onboardingCodes.onboardMovedLoad,
  onboardingCodes.inComplete,
]
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
const { getFormattedDateTime, getFormattedDate, getSmallerDate } = useDate()
const commitmentDetailsDialog = ref(null)
const computedEntities = computed(() => bookingsStore.bookings)
const formateTime = date => {
  return getFormattedDate(date)
}
const formateMinTime = dates => {
  // const maxDate = new Date(Math.max(...dates))
  const minData = getSmallerDate(dates)
  
  return getFormattedDate(minData)
}
const bookingStatus = item => {
  const bookings = computedEntities.value
  const booking = bookings.find(i => {
    const ids = i.ids
    
    return ids.includes(item.bookingId)
  })
  
  return booking?.status
}
const containerActionHandler = async ({ action, e }) => {
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
    emit('duplicateBooking', e[0])
  }
  if (action === 'view-trucker-details') {
    commitmentDetailsDialog.value.show(true)
    commitmentDetailsDialog.value.data = e[0]
  }
  if (action === 'approve-commitment') {
    openApproveCommitmentDialog(e[0])
  }
  if (action === 'complete-commitment') {
    openCompleteCommitmentDialog(e[0])
  }
  if (action === 'update-loadingdate') {
    openLoadingDateDialog(e[0])
  }
  if (action === 'decline-commitment') {
    openDeclineCommitmentDialog(e[0])
  }
  if (action === 'cancel-commitment') {
    openCancelCommitmentDialog(e[0])
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
const openApproveCommitmentDialog = commitment => {
  approveCommitmentDialog.value.show(true)
  approveCommitmentDialog.value.data = commitment
}
const openCancelBookingDialog = booking => {
  cancelBookingDialog.value.show(true)
  cancelBookingDialog.value.data = booking
}
const openCompleteCommitmentDialog = commitment => {
  completeCommitmentDialog.value.show(true)
  completeCommitmentDialog.value.data = commitment
}
const openLoadingDateDialog = commitment => {
  loadingDateDialog.value.show(true)
  loadingDateDialog.value.data = commitment
}
const openDeclineCommitmentDialog = data => {
  declineCommitmentDialog.value.show(true)
  declineCommitmentDialog.value.data = data
}
const openCancelCommitmentDialog = commiment => {
  cancelCommitmentDialog.value.show(true)
  cancelCommitmentDialog.value.data = commiment
}
const removeBooking = booking => {
  deleteBooking(booking)
  removeBookingDialog.value.show(false)
}
const onApproveCommitment = async commitment => {
  approveCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
  await approveCommitment(commitment)
}
const onCancelBooking = async (booking, reason) => {
  await updateBookingStatus(booking, statuses.canceled, reason)
  cancelBookingDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
}
const onCompleteCommitment = async (data, reason, onBoardedContainers) => {
  loadCompleteCommitment.value = true
  await completeCommitment(data, reason, onBoardedContainers)
  completeCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
  loadCompleteCommitment.value = false
}
const onLoadingDateUpdated = async (data, loadingDate) => {
  isloading.value = true
  await edit_commitment_loadingDate(data.id, loadingDate)
  loadingDateDialog.value.show(false)
  isloading.value = false
}

const onDeclineCommitment = async reason => {
  declineCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
  await declineCommitment(declineCommitmentDialog.value.data, reason)
}
const onCancelCommitment = async (commiment, reason) => {
  cancelCommitmentDialog.value.show(false)
  commitmentDetailsDialog.value.show(false)
  await cancelCommitment(commiment, reason)
}
const openCommitmentsDialogOnUrlChange = async () => {
  const commitment = await handleQueryUrlForCommitments(router.currentRoute.value.query)
  commitment &&
    (commitmentDetailsDialog.value.show(true), (commitmentDetailsDialog.value.data = commitment))
}
const tableId = 'bookingsTable'

onMounted(async () => {
  setTimeout(() => {
    const table = document.getElementById(tableId)
    tableHeight.value = smAndDown.value
      ? 396
      : window.innerHeight - table.getBoundingClientRect().top - 108
  })
})
onUpdated(async () => {
  await openCommitmentsDialogOnUrlChange()
})
watch(
  () => router.currentRoute.value.fullPath,
  async () => openCommitmentsDialogOnUrlChange(),
)
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
        {{ formateMinTime(item.details) || '--' }}
        <Popover
          activator="parent"
          location="top center"
        >
          <div class="flex justify-center gap-2 py-1">
            <VTable>
              <thead>
                <tr>
                  <th class="text-left">
                    Committed/Total
                  </th>
                  <th class="text-left">
                    Loading Date
                  </th>
                  <th class="text-left">
                    SCAC
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="data in item.details"
                  :key="data.date"
                >
                  <td class="text-center">
                    {{ data.committed }}/{{ data.containers }}
                  </td>
                  <td>{{ formateTime(data.date) || '--' }}</td>
                  <td>
                    <template
                      v-for="scac in data.scacs"
                      :key="scac"
                    >
                      <Chip class="m-1">
                        {{ scac }}
                      </Chip>
                    </template>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </div>
        </Popover>
      </Typography>
    </template>
    <template #location="{ item }">
      <LocationChip :location="item?.location" />
    </template>
    <template #worker="{ item }">
      <Typography>
        {{ item.createdBy?.name }}
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
        class="pl-16"
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
            {{ formateTime(item.loadingDate) }}
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
        btn-name="cancel"
        @close="cancelBookingDialog.show(false)"
        @onClickBtn="e => onCancelBooking(cancelBookingDialog.data, e)"
      />
    </template>
  </Dialog>
  <Dialog
    ref="approveCommitmentDialog"
    max-width="480"
  >
    <template #text>
      <ConfirmationDialog
        btn-name="Approve"
        btn-type="primary"
        @close="approveCommitmentDialog.show(false)"
        @onClickBtn="onApproveCommitment(approveCommitmentDialog.data)"
      >
        <Typography> Are you sure you want to approve this booking commitment? </Typography>
      </ConfirmationDialog>
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
        btn-name="cancel"
        @close="cancelCommitmentDialog.show(false)"
        @onClickBtn="e => onCancelCommitment(cancelCommitmentDialog.data, e)"
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
        @approveCommitment="openApproveCommitmentDialog"
        @completeCommitment="openCompleteCommitmentDialog"
        @declineCommitment="openDeclineCommitmentDialog"
        @close="commitmentDetailsDialog.show(false)"
      />
    </template>
  </Dialog>
</template>
