// eslint-disable-next-line import/no-unresolved
import { onDocumentCreated } from 'firebase-functions/v2/firestore'

export default onDocumentCreated('bookings/{docId}', event => {
  /* ... */
})
