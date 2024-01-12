import { commitCanceledNotifier } from '~/notifications/notifications'
import { addCommitmentCancellationToBooking } from '~/booking'

export const updateCommitmentListener = async (currentData, previousData) => {
  if (currentData.status === 'canceled' && previousData.status !== 'canceled') {
    try {
      await commitCanceledNotifier(currentData)
      await addCommitmentCancellationToBooking(currentData)
    } catch ({ message }) {
      console.error(message)
    }
  }
}
