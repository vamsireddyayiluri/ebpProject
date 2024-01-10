import { onDocumentDeleted } from 'firebase-functions/v2/firestore'
import { commitCancelNotifier } from '~/notifications/notifications'
import { addCommitmentCancellationToTimeline } from '~/booking'

export default onDocumentDeleted('commitments/{docId}', async event => {
  const data = event.data.data()
  await commitCancelNotifier(data)
  await addCommitmentCancellationToTimeline(data)
})
