import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import moment from 'moment-timezone'
import { uid } from 'uid'
import { db } from '../../../../../index'
import { FieldValue } from 'firebase-admin/firestore'

export default onDocumentUpdated('bookings/{docId}', async event => {
  await bookingFulfilledNotifier(event.data.after.data(), event.data.before.data())
})

const bookingFulfilledNotifier = async (currentData, previousData) => {
  if (
    currentData.committed !== previousData.committed &&
    currentData.committed === currentData.containers
  ) {
    const notification = {
      title: `Booking ${currentData.ref} fulfilled`,
      content: moment().format('MM/DD/YYYY hh:mm:ss a'),
      type: 'info',
      isUnread: true,
      id: uid(16),
      ref: currentData.ref,
    }

    const docRef = db.collection('notifications').doc(currentData.orgId)

    await docRef.update({
      list: FieldValue.arrayUnion(notification),
    })
  }
}
