import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { commitCreatedNotifier } from '~/notifications/notifications'
import { addCommitmentCreationToTimeline } from '~/booking'

export default onDocumentCreated('commitments/{docId}', async event => {
  const data = event.data.data()
  await commitCreatedNotifier(data)
  await addCommitmentCreationToTimeline(data)
})
