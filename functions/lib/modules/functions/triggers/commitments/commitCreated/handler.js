import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { commitCreatedNotifier } from '~/notifications'
import { addCommitmentCreationToBooking } from '~/timelinesUpdater'

export default onDocumentCreated('commitments/{docId}', async event => {
  const data = event.data.data()
  await commitCreatedNotifier(data)
  await addCommitmentCreationToBooking(data)
})
