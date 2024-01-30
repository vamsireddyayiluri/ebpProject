import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { commitCreatedNotifier } from '~/helpers/notifications'
import { addCommitmentCreationToBooking } from '~/helpers/timelinesUpdater'

export default onDocumentCreated('commitments/{docId}', async event => {
  const data = event.data.data()
  await commitCreatedNotifier(data)
  await addCommitmentCreationToBooking(data)
})
