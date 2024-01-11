import { onDocumentDeleted } from 'firebase-functions/v2/firestore'
import { commitCanceledNotifier } from '~/notifications/notifications'
import { addCommitmentCancellationToBooking } from '~/booking'

export default onDocumentDeleted('commitments/{docId}', async event => {
  const data = event.data.data()
  await commitCanceledNotifier(data)
  await addCommitmentCancellationToBooking(data)
})
