import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { updateCommitmentListener } from '~/helpers/commitment'

export default onDocumentUpdated('commitments/{docId}', async event => {
  await updateCommitmentListener(event.data.after.data(), event.data.before.data())
})
