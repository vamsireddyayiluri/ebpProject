import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { bookingFulfilledNotifier } from '~/helpers/notifications'
import { sendBookingPlatformNotifcations } from '~/helpers/notifications/validations'

export default onDocumentUpdated('bookings/{docId}', async event => {
  const { orgId } = event.data.after.data()
  const sendNotification = await sendBookingPlatformNotifcations(orgId)
  if (sendNotification) {
    await bookingFulfilledNotifier(event.data.after.data(), event.data.before.data())
  }
})
