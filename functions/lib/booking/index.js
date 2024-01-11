import { db } from '../index'
import { FieldValue } from 'firebase-admin/firestore'
import { bookingRemovedNotifier } from '~/notifications/notifications'

const collectionPath = 'bookings'
const updateTimeline = async (bookingId, point) => {
  try {
    const docRef = db.collection(collectionPath).doc(bookingId)
    await docRef.update({
      timeline: FieldValue.arrayUnion(point),
    })
  } catch ({ message }) {
    console.error(message)
  }
}
export const addCommitmentCreationToBooking = async data => {
  const point = {
    title: `${data.scac} committed ${data.committed} containers`,
    data: data.commitmentDate,
  }
  await updateTimeline(data.bookingId, point)
}
export const addCommitmentCancellationToBooking = async data => {
  const point = {
    title: `${data.scac} cancelled ${data.committed} containers`,
    data: data.commitmentDate,
  }
  await updateTimeline(data.bookingId, point)
}
export const removeBookingListener = async data => {
  // find all commitments for this booking
  const query = db.collection('commitments').where('bookingId', '==', data.id)
  const snapshot = await query.get()
  snapshot.forEach(doc => {
    const commit = doc.data()
    if (commit.status === 'pending' || commit.status === 'approved') {
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
