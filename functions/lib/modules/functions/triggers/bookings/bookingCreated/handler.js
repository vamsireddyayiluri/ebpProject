import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { bookingCreatedNotifier } from '~/notifications/notifications'
import { sendBookingPlatformNotifcations } from '~/helpers/notifications'

export default onDocumentCreated('bookings/{docId}', async event => {
  const { orgId } = event.data.data()
  const sendNotification = await sendBookingPlatformNotifcations(orgId)
  if (sendNotification) {
    await bookingCreatedNotifier(event.data.data())
  }
})
