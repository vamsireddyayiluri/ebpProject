import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: Cypress.env('VITE_APP_GOOGLE_API_KEY'),
  authDomain: Cypress.env('VITE_APP_AUTH_DOMAIN'),
  projectId: Cypress.env('VITE_APP_PROJECT_ID'),
  storageBucket: Cypress.env('VITE_APP_STORAGE_URL'),
  appId: Cypress.env('VITE_APP_APP_ID'),
}

const app = initializeApp(firebaseConfig)

const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }
