import { db } from '../index'
import { FieldValue } from 'firebase-admin/firestore'
import { uid } from 'uid'
import moment from 'moment-timezone'

const collectionPath = 'notifications'
const createNotificationObj = data => {
  return {
    content: moment(data.createdAt).format('MM/DD/YYYY hh:mm:ss a'),
    type: 'info',
    isUnread: true,
    id: uid(16),
  }
}
const updateNotificationList = async (orgId, notification) => {
  try {
    const docRef = db.collection(collectionPath).doc(orgId)
    await docRef.update({
      list: FieldValue.arrayUnion(notification),
    })
  } catch ({ message }) {
    console.error(message)
  }
}
export const bookingCreatedNotifier = async data => {
  const notification = {
    ...createNotificationObj(data),
    title: `Booking ${data.ref} has been created`,
    ref: data.ref,
  }
  await updateNotificationList(data.orgId, notification)
}
export const bookingFulfilledNotifier = async (currentData, previousData) => {
  if (
    currentData.committed !== previousData.committed &&
    currentData.committed === currentData.containers
  ) {
    const notification = {
      ...createNotificationObj(currentData),
      title: `Booking ${currentData.ref} fulfilled`,
      ref: currentData.ref,
    }
    await updateNotificationList(currentData.orgId, notification)
  }
}
export const bookingRemovedNotifier = async data => {
  const notification = {
    ...createNotificationObj(data),
    title: `Booking ${data.ref} removed, commit declined`,
  }
  await updateNotificationList(data.orgId, notification)
}
export const commitCreatedNotifier = async data => {
  const notification = {
    ...createNotificationObj(data),
    title: `Trucker ${data.scac} offered capacity for booking ${data.ref}`,
  }
  await updateNotificationList(data.bookingOrgId, notification)
}
export const commitCanceledNotifier = async data => {
  const notification = {
    ...createNotificationObj(data),
    title: `Trucker ${data.scac} canceled load for booking ${data.ref}`,
  }
  await updateNotificationList(data.bookingOrgId, notification)
}
export const commitApprovedNotifier = async data => {
  const notification = {
    ...createNotificationObj(data),
    title: `${data.company} approved the booking request of ${data.committed} containers. 
    Please reach out to exporter contacts to begin the onboarding process: ${data.ref}`,
  }
  await updateNotificationList(data.bookingOrgId, notification)
}
export const commitDeclinedNotifier = async data => {
  const notification = {
    ...createNotificationObj(data),
    title: `${data.company} declined the booking ${data.ref}`,
  }
  await updateNotificationList(data.bookingOrgId, notification)
}
