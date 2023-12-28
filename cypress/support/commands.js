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

Cypress.Commands.add('userLogin', (email, password) => {
  cy.contains('button', 'Log in').should('be.disabled')
  cy.getInputByLabel('Email').type(email)
  cy.getInputByLabel('Password').type(password)
  cy.contains('button', 'Log in').should('be.enabled').click()
})

Cypress.Commands.add('logout', () => {
  cy.xpath('//*[@id="userMenu"]').click()
  cy.get('.logoutBtn').click()
})

import { auth, db } from './firebase'
import { deleteDoc, getDoc, query, where, collection, getDocs, doc } from 'firebase/firestore'
import moment from 'moment-timezone'

Cypress.Commands.add('getUsersData', async email => {
  const q = query(collection(db, 'users'), where('email', '==', email))
  const docData = await getDocs(q)
  return docData.docs
})

Cypress.Commands.add('searchDocData', async (coll, label, value) => {
  const q = query(collection(db, coll), where(label, '==', value))
  const docData = await getDocs(q)
  return docData.docs
})

Cypress.Commands.add('searchDataWithTwoLables', async (coll, label1, value1, label2, value2) => {
  if (label2 === 'bookingExpiry') {
    value2 = moment(value2).format()
  }
  const q = query(collection(db, coll), where(label1, '==', value1), where(label2, '==', value2))
  const docData = await getDocs(q)
  return docData.docs
})

Cypress.Commands.add('getDocData', async (coll, document) => {
  const q = query(doc(db, coll, document))
  const docData = await getDoc(q)
  return docData.data()
})

Cypress.Commands.add('verifyEmail', async email => {
  const userName = email.split('@')[0]
  const domain = email.split('@')[1]
  try {
    const response = await fetch(
      'https://www.1secmail.com/api/v1/?action=getMessages&login=' + userName + '&domain=' + domain,
    )

    const allEmails = await response.json()
    const latestEmail = await allEmails[0]
    const data = await fetch(
      'https://www.1secmail.com/api/v1/?action=readMessage&login=' +
        userName +
        '&domain=' +
        domain +
        '&id=' +
        latestEmail.id,
    )
    const message = await data.json()
    const parser = new DOMParser()
    const parsedHTML = parser.parseFromString(message.htmlBody, 'text/html')
    const anchorElement = parsedHTML.querySelector('a')
    const hrefValue = anchorElement.getAttribute('href')
    return hrefValue
  } catch (error) {
    console.log('error', error)
  }
})

// Removing user from the firebase

Cypress.Commands.add('removeUser', email => {
  const user = auth.currentUser
  const userId = user.uid
  user
    .delete()
    .then(async () => {
      const q = query(doc(db, 'users', userId))
      const docData = await getDoc(q)
      await deleteDoc(q)
      const orgId = docData.data().orgId
      const oq = query(doc(db, 'organizations', orgId))
      const organizationDoc = await getDoc(oq)
      if (organizationDoc.data().email === email) {
        await deleteDoc(oq)
      }
    })
    .catch(error => {
      console.log('error', error)
    })
})
