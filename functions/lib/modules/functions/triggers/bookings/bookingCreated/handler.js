// eslint-disable-next-line import/no-unresolved
import { onDocumentWritten } from 'firebase-functions/v2/firestore'

export default onDocumentWritten('bookings/{docId}', event => {
  /* ... */
})
