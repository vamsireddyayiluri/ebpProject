import { db } from '../../index'

const collectionPath = 'notifications'

const bothNotifications = 'both notifications'
const platformNotifications = 'notifications on the platform'
const emailNotifications = 'notifications by email'

export const sendBookingPlatformNotifcations = async orgId => {
  const doc = await db.collection(collectionPath).doc(orgId).get()
  const { settings } = doc.data()
  if (settings?.bookingsNotification?.active) {
    const value = settings?.bookingsNotification.value
    return value === platformNotifications || value === bothNotifications ? true : false
  } else {
    return false
  }
}

export const sendBookingEmailNotfications = async orgId => {
  const doc = await db.collection(collectionPath).doc(orgId).get()
  const { settings } = doc.data()
  if (settings?.bookingsNotification?.active) {
    const value = settings?.bookingsNotification.value
    return value === emailNotifications || value === bothNotifications ? true : false
  } else {
    return false
  }
}

export const sendNewsAndUpdatesPlatformNotfications = async orgId => {
  const doc = await db.collection(collectionPath).doc(orgId).get()
  const { settings } = doc.data()
  if (settings?.newsAndUpdates?.active) {
    const value = settings?.newsAndUpdates.value
    return value === platformNotifications || value === bothNotifications ? true : false
  } else {
    return false
  }
}

export const sendNewsAndUpdatesEmailNotfications = async orgId => {
  const doc = await db.collection(collectionPath).doc(orgId).get()
  const { settings } = doc.data()
  if (settings?.newsAndUpdates?.active) {
    const value = settings?.newsAndUpdates.value
    return value === emailNotifications || value === bothNotifications ? true : false
  } else {
    return false
  }
}
