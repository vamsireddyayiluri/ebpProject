import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { bookingFulfilledNotifier } from '~/notifications'

export default onDocumentUpdated('bookings/{docId}', async event => {
  await bookingFulfilledNotifier(event.data.after.data(), event.data.before.data())
})
