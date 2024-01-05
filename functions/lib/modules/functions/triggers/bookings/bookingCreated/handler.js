import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { bookingCreatedNotifier } from '~/notifications/notifications'

export default onDocumentCreated('bookings/{docId}', async event => {
  await bookingCreatedNotifier(event.data.data())
})
