import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_GOOGLE_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_STORAGE_URL,
  appId: import.meta.env.VITE_APP_APP_ID,
}

const firebaseConfigAuth = {
  apiKey: import.meta.env.VITE_APP_EBP_GOOGLE_API_KEY,
  authDomain: import.meta.env.VITE_APP_EBP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_EBP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_STORAGE_URL,
  appId: import.meta.env.VITE_APP_EBP_APP_ID,
}

const appAuth = initializeApp(firebaseConfigAuth, 'auth')
const app = initializeApp(firebaseConfig)

const auth = getAuth(appAuth)
const v1Auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { auth, db, storage, v1Auth}
