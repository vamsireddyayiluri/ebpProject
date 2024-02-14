import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { bookingFulfilledNotifier } from '~/helpers/notifications'
import { sendBookingPlatformNotifcations } from '~/helpers/notifications/validations'
import { updateBookingFull, checkAllBookingCommitments } from '~/helpers/booking'

export default onDocumentUpdated('bookings/{docId}', async event => {
  const { orgId, committed, containers, id, status } = event.data.after.data()
  const sendNotification = await sendBookingPlatformNotifcations(orgId)
  if (parseInt(committed) === parseInt(containers) && status !== 'completed') {
    await updateBookingFull(id)
    await checkAllBookingCommitments(id)
  }

  if (sendNotification) {
    await bookingFulfilledNotifier(event.data.after.data(), event.data.before.data())
  }
})
