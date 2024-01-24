import { db } from '../notifications/index'
import { bookingRemovedNotifier } from '~/notifications'

export const removeBookingListener = async data => {
  // find all commitments for this booking
  const query = db.collection('commitments').where('bookingId', '==', data.id)
  const snapshot = await query.get()
  snapshot.forEach(doc => {
    const commit = doc.data()
    if (commit.status === 'pending') {
      // change status
      const docRef = db.collection('commitments').doc(doc.id)
      docRef.update({
        status: 'declined',
      })
      // send notification
      bookingRemovedNotifier(commit)
    }
  })
}
