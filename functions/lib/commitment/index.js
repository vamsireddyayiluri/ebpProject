import {
  commitApprovedNotifier,
  commitCanceledNotifier,
  commitDeclinedNotifier,
} from '~/notifications'
import {
  addCommitmentApproving,
  addCommitmentCancellation,
  addCommitmentDeclining,
} from '~/timelinesUpdater'

export const updateCommitmentListener = async (currentData, previousData) => {
  try {
    if (currentData.status === 'canceled' && previousData.status !== 'canceled') {
      await commitmentCancelAction(currentData)
    }
    if (currentData.status === 'approved' && previousData.status === 'pending') {
      await commitmentApproveAction(currentData)
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
}
const commitmentDeclineAction = async data => {
  await commitDeclinedNotifier(data)
  await addCommitmentDeclining(data)
}
