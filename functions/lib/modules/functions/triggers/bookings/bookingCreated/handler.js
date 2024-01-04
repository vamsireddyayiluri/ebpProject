// eslint-disable-next-line import/no-unresolved
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import {bookingCreatedNotifier} from "../../../../../notifications/notifications";

export default onDocumentCreated('bookings/{docId}', event => {
  bookingCreatedNotifier(event.data.data())
})
