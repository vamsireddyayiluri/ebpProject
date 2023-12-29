import admin from 'firebase-admin'
import 'dotenv/config'
import runtimeConfig from '~/runtimeConfig'

import { bookingCreated } from '~/modules/functions'

if (runtimeConfig.runtime.env === 'development' && !process.env.CI) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
}

admin.initializeApp()

export default {
  bookingCreated,
}
