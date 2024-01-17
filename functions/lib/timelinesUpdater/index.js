import { db } from '../index'
import { FieldValue } from 'firebase-admin/firestore'

const updateTimelines = async (bookingId, commitmentId, point) => {
  try {
    const bookingDocRef = db.collection('bookings').doc(bookingId)
    await bookingDocRef.update({
      timeline: FieldValue.arrayUnion(point),
    })
    const commitmentDocRef = db.collection('commitments').doc(commitmentId)
    await commitmentDocRef.update({
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
  await updateTimelines(data.bookingId, data.id, point)
}
export const addCommitmentCancellation = async data => {
  const point = {
    title: `${data.scac} cancelled ${data.committed} containers`,
    data: data.commitmentDate,
  }
  await updateTimelines(data.bookingId, data.id, point)
}
export const addCommitmentApproving = async data => {
  const point = {
    title: `${data.company} approved ${data.committed} containers`,
    data: data.commitmentDate,
  }
  await updateTimelines(data.bookingId, data.id, point)
}
export const addCommitmentDeclining = async data => {
  const point = {
    title: `${data.company} declined commitment`,
    data: data.commitmentDate,
  }
  await updateTimelines(data.bookingId, data.id, point)
}
