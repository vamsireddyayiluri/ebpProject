import {
  commitApprovedNotifier,
  commitIncompleteNotifier,
  commitCanceledNotifier,
  commitDeclinedNotifier,
} from '~/helpers/notifications'
import {
  addCommitmentApproving,
  addCommitmentCancellation,
  addCommitmentDeclining,
  addCommitmentOnboarding,
} from '~/helpers/timelinesUpdater'
import { updateBookingCommit, checkAllBookingCommitments } from '~/helpers/booking'

export const updateCommitmentListener = async (currentData, previousData) => {
  try {
    if (currentData.status === 'canceled' && previousData.status !== 'canceled') {
      await commitmentCancelAction(currentData)
    }
    if (currentData.status === 'approved' && previousData.status === 'pending') {
      await commitmentApproveAction(currentData)
    }
    if (currentData.status === 'onboarded' && previousData.status === 'approved') {
      await commitmentOnboardedAction(currentData)
    }
    if (currentData.status === 'incomplete' && previousData.status === 'approved') {
      await commitmentIncompleteAction(currentData)
    }
    if (currentData.status === 'declined' && previousData.status === 'pending') {
      await commitmentDeclineAction(currentData)
    }
  } catch ({ message }) {
    console.error(message)
  }
}
const commitmentCancelAction = async data => {
  await commitCanceledNotifier(data)
  await addCommitmentCancellation(data)
}
const commitmentApproveAction = async data => {
  await commitApprovedNotifier(data)
  await addCommitmentApproving(data)
  await updateBookingCommit('increase', data)
}
const commitmentOnboardedAction = async data => {
  await addCommitmentOnboarding(data)
  await checkAllBookingCommitments(data.bookingId)
}
const commitmentIncompleteAction = async data => {
  await commitIncompleteNotifier(data)
  await addCommitmentApproving(data)
  await checkAllBookingCommitments(data.bookingId)
}
const commitmentDeclineAction = async data => {
  await commitDeclinedNotifier(data)
  await addCommitmentDeclining(data)
}

