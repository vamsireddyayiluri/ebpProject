import admin from 'firebase-admin'
import * as firebaseFunctions from 'firebase-functions'
import app from './modules/webApp/server'
import 'dotenv/config'
import runtimeConfig from '@/runtimeConfig'

import // add functions
'./modules/functions/handlers'

if (runtimeConfig.runtime.env === 'development' && !process.env.CI) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FB_PROJECT_ID,
    clientEmail: process.env.FB_CLIENT_EMAIL,
    privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL: process.env.FB_DATABASE_URL,
})

const webApp = firebaseFunctions.https.onRequest(app)

export default {
  addPaymentMethodDetails,
  addPayoutMethodDetails,
  deletePaymentMethodDetails,
  // createStripePayment,
  confirmStripePayment,
  cleanupUser,
  commentCreated,
  containerUpdated,
  organizationCreated,
  turnCreated,
  turnUpdated,
  turnDeleted,
  reservationCreated,
  reservationUpdated,
  reservationDeleted,
  scheduledFunctionPrepareEmissionsReport,
  scheduledFunctionCleanupApprovedTurns,
  scheduledFuctionCheckForContainersWithoutGeocode,
  scheduledFunctionCheckForTurnsWithoutDistanceAndCenter,
  scheduleFunctionAddEmailUpdateReport,
  scheduledFunctionAddEmailWeeklyReport,
  scheduledFunctionAddDailyReport,
  scheduledFunctionFirestoreDailyBackup,
  scheduledFunctionAlertOverduePendingTurns,
  scheduledFunctionCleanupExpiredNetworkContainers,
  scheduledFunctionDemoEnvironmentUpdateTurnStatus,
  scheduledFunctionCleanupEmailEventRecords,
  scheduledFunctionAlertOverdueApprovedReservations,
  scheduledFunctionCleanupNotifications,
  webApp,
}
