import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { bookingCreatedNotifier } from '~/helpers/notifications'
import { sendBookingPlatformNotifcations } from '~/helpers/notifications/validations'

export default onDocumentCreated('bookings/{docId}', async event => {
  const { orgId } = event.data.data()
  const sendNotification = await sendBookingPlatformNotifcations(orgId)
  if (sendNotification) {
    await bookingCreatedNotifier(event.data.data())
  }
})
