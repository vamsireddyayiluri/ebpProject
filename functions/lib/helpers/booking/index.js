import { db } from '../../index'
import { bookingRemovedNotifier } from '~/helpers/notifications'
import admin from 'firebase-admin'

export const removeBookingListener = async data => {
  // find all commitments for this booking
  const snapshot = getBookingCommitments(data.id)
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
        committed: updatedCount,
      })
      if (parseInt(booking.committed + updatedCount.operand) === parseInt(booking.containers)) {
        await updateBookingStatus(data.bookingId, 'pending')

        await updateBookingFull(data.bookingId)
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
      status,
    })
  } catch ({ message }) {
    console.error(message)
  }
}

export const checkAllBookingCommitments = async bookingId => {
  const booking = await getBooking(bookingId)
  const snapshot = await getBookingCommitments(bookingId)

  if (booking?.containers === booking?.committed) {
    const pendingCommitments = snapshot?.docs?.filter(
      doc => doc.data().status === 'pending' || doc.data().status === 'approved',
    )
    if (!pendingCommitments?.length) {
      updateBookingStatus(bookingId, 'completed')
    }
  }
}

// Update pending commitments to booking full if booking capacity fulfilled
export const updateBookingFull = async bookingId => {
  const snapshot = await getBookingCommitments(bookingId)
  const pendingCommitments = snapshot.docs?.filter(doc => doc.data().status === 'pending')
  if (pendingCommitments.length) {
    const batch = admin.firestore().batch()
    await Promise.all(
      pendingCommitments.map(doc => {
        batch.update(doc.ref, {
          status: 'booking full',
          // updated: getLocalServerTime(moment(), timezone).format(),
        })
      }),
    )
    await batch.commit()
  }
}

export const getBookingCommitments = async bookingId => {
  const query = db.collection('commitments').where('bookingId', '==', bookingId)
  const snapshot = await query.get()

  return snapshot
}

export const getBooking = async bookingId => {
  const docRef = db.collection('bookings').doc(bookingId)
  const docSnapshot = await docRef.get()
  return docSnapshot.data()
}
