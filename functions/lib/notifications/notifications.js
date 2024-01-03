// eslint-disable-next-line import/named
import { db } from "../index";
const { FieldValue } = require('firebase-admin/firestore');
import { uid } from "uid";
import moment from "moment-timezone";

const collectionPath = 'notifications';
export const bookingCreatedNotifier = async data => {
  const notification = {
    title: `Booking ${data.ref} has been created`,
    content: moment(data.createdAt).format('MM/DD/YYYY hh:mm:ss a'),
    type: 'info',
    isUnread: true,
    id: uid(16),
    ref: data.ref,
  };
  const docRef = db.collection(collectionPath).doc(data.orgId);
  await docRef.update({
    list: FieldValue.arrayUnion(notification),
  });
}
export const bookingFulfilledNotifier = async (currentData, previousData) => {
  if (currentData.committed !== previousData.committed && currentData.committed === currentData.containers) {
    const notification = {
      title: `Booking ${currentData.ref} fulfilled`,
      content: moment().format('MM/DD/YYYY hh:mm:ss a'),
      type: 'info',
      isUnread: true,
      id: uid(16),
      ref: currentData.ref,
    };
    const docRef = db.collection(collectionPath).doc(currentData.orgId);
    await docRef.update({
      list: FieldValue.arrayUnion(notification),
    });
  }
}
