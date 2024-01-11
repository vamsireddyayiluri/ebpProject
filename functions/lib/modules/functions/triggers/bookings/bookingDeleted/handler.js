import { onDocumentDeleted } from 'firebase-functions/v2/firestore'
import { removeBookingListener } from '~/booking'

export default onDocumentDeleted('bookings/{docId}', async event => {
  const data = event.data.data()
  await removeBookingListener(data)
})
