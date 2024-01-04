import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import moment from 'moment-timezone'
import { uid } from 'uid'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '~/firebase'

export default onDocumentCreated('bookings/{docId}', async event => {
  await bookingCreatedNotifier(event.data.data())
})

const bookingCreatedNotifier = async data => {
  const notification = {
    title: `Booking ${data.ref} has been created`,
    content: moment(data.createdAt).format('MM/DD/YYYY hh:mm:ss a'),
    type: 'info',
    isUnread: true,
    id: uid(16),
    ref: data.ref,
  }

  const docRef = db.collection('notifications').doc(data.orgId)

  await docRef.update({
    list: FieldValue.arrayUnion(notification),
  })
}
