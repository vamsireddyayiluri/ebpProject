import { db } from '../index'
import { FieldValue } from 'firebase-admin/firestore'

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
export const addCommitmentCreationToTimeline = async data => {
  const point = {
    title: `${data.scac} committed ${data.committed} containers`,
    data: data.commitmentDate,
  }
  await updateTimeline(data.bookingId, point)
}

export const addCommitmentCancellationToTimeline = async data => {
  const point = {
    title: `${data.scac} cancelled ${data.committed} containers`,
    data: data.commitmentDate,
  }
  await updateTimeline(data.bookingId, point)
}
