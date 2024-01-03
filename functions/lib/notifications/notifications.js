// eslint-disable-next-line import/named
import { db } from "../index";
const { FieldValue } = require('firebase-admin/firestore');
import { uid } from "uid";
import moment from "moment-timezone";

export const bookingCreatedNotifier = async data => {
  const collectionPath = 'notifications';
  const notification = {
    title: `Booking ${data.ref} has been created`,
    content: moment(data.createdAt).format('MM/DD/YYYY hh:mm:ss a'),
    type: 'info',
    isUnread: true,
    id: uid(16),
    ref: data.ref,
  };
  const docRef = db.collection(collectionPath).doc(data.orgId);

  const snapshot = await docRef.get()
  if (snapshot.data()?.list) {
    await docRef.update({
      list: FieldValue.arrayUnion(notification),
    });
  } else {
    await docRef.set({
      ...snapshot.data(),
      list: [notification],
      id: data.orgId,
    })
  }
}
