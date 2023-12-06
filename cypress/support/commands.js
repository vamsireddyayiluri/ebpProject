// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//  <reference types="cypress-xpath" />
Cypress.Commands.add('getInputByLabel', label => {
  return cy
    .contains('label', label)
    .invoke('attr', 'for')
    .then(id => {
      cy.get('#' + id)
    })
})

// import {initializeApp} from 'firebase/app'
// import 'firebase/compat/auth'
// import 'firebase/database'
// import 'firebase/firestore'
// import { attachCustomCommands } from 'cypress-firebase'

// const fbConfig = {
//   // Your config from Firebase Console
//   apiKey: process.env.VITE_APP_GOOGLE_API_KEY,
//   authDomain: process.env.VITE_APP_AUTH_DOMAIN,
//   projectId: process.env.VITE_APP_PROJECT_ID,
//   storageBucket: process.env.VITE_APP_STORAGE_URL,
//   appId: process.env.VITE_APP_APP_ID,
// }

// const app=initializeApp(fbConfig)

// attachCustomCommands({ Cypress, cy, app })

// import firebase from 'firebase/compat/app';
// import 'firebase/compat/auth';
// import 'firebase/compat/database';
// import 'firebase/compat/firestore';
// import { attachCustomCommands } from 'cypress-firebase';

// const fbConfig = {
//   // Your config from Firebase Console
//   apiKey: process.env.VITE_APP_GOOGLE_API_KEY,
//   authDomain: process.env.VITE_APP_AUTH_DOMAIN,
//   projectId: process.env.VITE_APP_PROJECT_ID,
//   databaseURL: 'https://ebpv3-69501.firebaseio.com',
//   storageBucket: process.env.VITE_APP_STORAGE_URL,
//   appId: process.env.VITE_APP_APP_ID,
// };

// firebase.initializeApp(fbConfig);

// attachCustomCommands({ Cypress, cy, firebase });

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, updateCurrentUser } from 'firebase/auth'
import { getDoc, getFirestore, query, where } from 'firebase/firestore'
import { collection, getDocs, doc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDpBg2kbRRTtACaKJ6g4Q3hmgYRwNmGtbs',
  authDomain: 'ebpv3-69501.firebaseapp.com',
  projectId: 'ebpv3-69501',
  storageBucket: 'qualle-development.appspot.com',
  appId: '1:924145667892:web:91a78cab537d5102991f61',
}
const app = initializeApp(firebaseConfig)
console.log('testing', Cypress.env('apiKey'))

const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }

Cypress.Commands.add('getUsersData', async email => {
  const q = query(collection(db, 'users'), where('email', '==', email))
  const docData = await getDocs(q)
  return docData.docs
})

Cypress.Commands.add('getDocData', async (coll, document) => {
  const q = query(doc(db, coll, document))
  const docData = await getDoc(q)
  return docData.data()
})

Cypress.Commands.add('verifyEmailAddress', async () => {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  const userId = user.uid

  updateCurrentUser(userId, {
    emailVerified: true,
    displayName: 'sravnthi test',
  }).then(record => {
    console.log('user rrecord', record)
  })
})

// https://firebase.google.com/docs/auth/admin/manage-users#update_a_user

auth.updateCurrentUser()
