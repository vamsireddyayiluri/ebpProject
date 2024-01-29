import { db } from "../../index"
import { bookingRemovedNotifier } from '~/helpers/notifications'
import admin from 'firebase-admin'

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

export const updateBookingCommit = async (type, data) => {
  try {
    // find booking
    const docRef = db.collection('bookings').doc(data.bookingId)
    const docSnapshot = await docRef.get()
    const booking = docSnapshot.data()
    const committed = +data.committed
    if (type === 'increase') {
      const updatedCount = admin.firestore.FieldValue.increment(committed)
      await docRef.update({
        committed: updatedCount
      })
      if (updatedCount.operand === booking.containers) {
        await updateBookingStatus(data.bookingId, 'pending')
      }
    }
  } catch ({ message }) {
    console.error(message)
  }
}

export const updateBookingStatus = async (id, status) => {
  try {
    const docRef = db.collection('bookings').doc(id)
    await docRef.update({
      status
    })
  } catch ({ message }) {
    console.error(message)
  }
}
