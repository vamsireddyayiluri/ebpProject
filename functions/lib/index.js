import admin from 'firebase-admin'
import 'dotenv/config'
import runtimeConfig from './runtimeConfig'

import { bookingCreated, bookingUpdated, commitCreated, commitDeleted } from './modules/functions'

if (runtimeConfig.runtime.env === 'development' && !process.env.CI) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
}

admin.initializeApp()
export const db = admin.firestore()

export default {
  db,
  bookingCreated,
  bookingUpdated,
  commitCreated,
  commitDeleted,
}
