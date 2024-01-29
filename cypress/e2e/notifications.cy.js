import {
  fillBookingRef,
  fillBookingEquipment,
  fillBookingExpiration,
  fillBookingSSL,
  fillBookingYard,
  fillNoOfContainers,
  fillPreferedCarrier,
  fillTruckerScac,
} from '../helpers/bookings'
import { bookingData, bookingDatawithoutNotification } from '../fixtures/notifications'
import { validData as register } from '../fixtures/register'

function createBooking(bookingData) {
  fillBookingRef(bookingData.ref)
  fillNoOfContainers(bookingData.noOfContainers)
  fillBookingSSL(bookingData.ssl)
  fillBookingExpiration(bookingData.expiry)
  fillPreferedCarrier(bookingData.pcw)
  fillBookingYard(bookingData.yard)
  fillBookingEquipment(bookingData.equipmentType)
  fillTruckerScac(bookingData.TruckersScac)
  cy.getInputByLabel('Booking Expiration *')
    .invoke('val')
    .then(sometext => {
      cy.wrap(sometext).as('expiry')
    })

  cy.get('@submitbutton').should('be.enabled').click({ force: true })
  cy.wait(2000)

  cy.get('@expiry').then(sometext => {
    cy.searchDataWithTwoLables('bookings', 'ref', bookingData.ref, 'bookingExpiry', sometext).then(
      docs => {
        expect(docs.length).to.be.at.least(1)
      },
    )
  })
}

function removeBooking(bookingData) {
  cy.get('button[type="button"]').contains('Map').click({ force: true })
  cy.get('#bookingsTable')
    .get(`.v-col[data-column="ref"]`)
    .find(` :contains(${bookingData.ref})`)
    .parent()
    .parent()
    .find(`.v-col[data-column="expiry"] :contains(${bookingData.expiryDate})`)
    .parent()
    .parent()
    .as('selectedRow')

  cy.get('@selectedRow')
    .find('button')
    .as('actionbutton')
    .then(element => {
      if (element.length) {
        cy.log(element)
        cy.get('@actionbutton').find('.mdi-dots-vertical').click()
      } else {
        cy.get('@selectedRow').scrollTo('right').find('.mdi-dots-vertical').click()
      }
    })
  cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Remove booking').click()

  cy.get('.v-dialog').should('be.visible')

  cy.get('button[type="button"]').contains('Remove').click()

  cy.get('.v-alert').contains('Bookings removed!')
}

describe('notifications', () => {
  before(() => {
    cy.url().then(url => {
      cy.visit('/settings')
      cy.wait(3000)
      cy.url().then(url => {
        if (!url.includes('/settings')) {
          cy.visit('/login')
          cy.userLogin(register[0].email, register[0].password)
          cy.wait(3000)
          cy.visit('/settings')
        }
      })
    })
  })
  it('check notifications are enabled after registration', () => {
    cy.get('button[type="button"]').should('be.visible').contains('Notifications').click()
    cy.getInputByLabel('News and updates').should('be.checked')
    cy.get('.notificationTab').find('.mdi-chevron-down').first().click()
    cy.get('#newsAndUpdates')
      .as('newsUpdates')
      .find(`.v-label`)
      .contains('Get notifications both on the platform and by email')
      .invoke('attr', 'for')
      .then(id => {
        cy.get('@newsUpdates')
          .find('#' + id)
          .should('be.checked')
      })

    cy.getInputByLabel('Information about bookings').should('be.checked')
    cy.get('.notificationTab').find('.mdi-chevron-down').last().click()
    cy.get('#bookingsInfo')
      .as('bookingInfo')
      .find(`.v-label`)
      .contains('Get notifications both on the platform and by email')
      .invoke('attr', 'for')
      .then(id => {
        cy.get('@bookingInfo')
          .find('#' + id)
          .should('be.checked')
      })

    cy.get('button[type="submit"]').should('be.disabled').contains('Save')
    cy.get('button[type="button"]').should('be.disabled').contains('Cancel changes')
  })
  it('Cancel edit changes', () => {
    cy.get('#newsAndUpdates')
      .find(`.v-label`)
      .contains('Get notifications on the platform')
      .invoke('attr', 'for')
      .then(id => {
        cy.get('#' + id).check()
      })
    cy.get('#bookingsInfo')
      .find(`.v-label`)
      .contains('Get notifications on the platform')
      .invoke('attr', 'for')
      .then(id => {
        cy.get('#' + id).check()
      })
    cy.get('button[type="button"]').should('be.enabled').contains('Cancel changes').click()

    cy.get('#newsAndUpdates')
      .find(`.v-label`)
      .contains('Get notifications both on the platform and by email')
      .invoke('attr', 'for')
      .then(id => {
        cy.get('#' + id).should('be.checked')
      })
    cy.get('#bookingsInfo')
      .find(`.v-label`)
      .contains('Get notifications both on the platform and by email')
      .invoke('attr', 'for')
      .then(id => {
        cy.get('#' + id).should('be.checked')
      })
  })
  it('check booking plateform notifications are sending in enable mode ', () => {
    cy.get('a[href="/dashboard"]').click()
    cy.get('button[type="button"]').contains('Booking').click()
    cy.contains('button', 'Create booking').should('be.visible').click()
    cy.get('.v-dialog').should('be.visible')
    cy.get('button[type="submit"]').should('be.disabled').as('submitbutton').contains('Create')

    createBooking(bookingData)
    cy.get('.v-alert').contains(`Booking ${bookingData.ref} has been created`)

    // Check notification
    cy.get('#notificationId').click({ force: true })
    cy.get('.notification-popup').should('be.visible')
    cy.get('.notification-popup').find('button[type="button"]').contains('Unread').click()

    cy.get('.notification-list')
      .find('.alert-notification')
      .as('notifications')
      .its('length')
      .should('be.gte', 0)
    cy.get('@notifications').contains(`Booking ${bookingData.ref} has been created`).should('exist')
    cy.get('#notificationId').click()

    // Removing booking
    removeBooking(bookingData)
  })
  it('read all notifications', () => {
    cy.get('#notificationId').click()
    cy.get('.notification-popup').find('button[type="button"]').contains('Mark all as read').click()
    cy.get('.notification-popup').find('button[type="button"]').contains('Unread').click()
    cy.get('.notification-popup').contains('You read all messages').should('exist')
    cy.get('.notification-popup').find('button[type="button"]').contains('All messages').click()
    cy.get('.notification-list')
      .find('.alert-notification')
      .contains(`Booking ${bookingData.ref} has been created`)
      .should('exist')
  })
  it('Edit notification data', () => {
    cy.get('a[href="/settings"]').click()
    cy.get('button[type="button"]').contains('Notifications').click()
    cy.get('.notificationTab').find('.mdi-chevron-down').first().click()
    cy.get('#newsAndUpdates')
      .find(`.v-label`)
      .contains('Get notifications by email')
      .invoke('attr', 'for')
      .then(id => {
        cy.get('#' + id).check()
      })
    cy.get('.notificationTab').find('.mdi-chevron-down').last().click()
    cy.get('#bookingsInfo')
      .find(`.v-label`)
      .contains('Get notifications by email')
      .invoke('attr', 'for')
      .then(id => {
        cy.get('#' + id).check()
      })
    cy.get('button[type="submit"]').should('be.enabled').contains('Save').click()

    // cy.getInputByLabel('Get notifications on the platform').check()
    // cy.get('button[type="submit"]').should('be.enabled').contains('Save').click()
    // cy.get('.mdi-close').click({ force: true })
    // cy.contains('Are you sure you want to save the changes?')
    cy.get('.v-dialog').get('button[type="button"]').contains('Save').click()
    cy.get('.v-alert').contains('Notifications settings updated!')
  })
  it('check booking plateform notifications are sending in off mode ', () => {
    cy.get('a[href="/dashboard"]').click()
    cy.get('button[type="button"]').contains('Booking').click()
    cy.contains('button', 'Create booking').should('be.visible').click()
    cy.get('.v-dialog').should('be.visible')
    cy.get('button[type="submit"]').should('be.disabled').as('submitbutton').contains('Create')

    createBooking(bookingDatawithoutNotification)
    cy.get('.v-alert').should('not.exist')

    // Check notification
    cy.get('#notificationId').click({ force: true })
    cy.get('.notification-popup').should('be.visible')
    cy.get('.notification-popup').find('button[type="button"]').contains('Unread').click()

    cy.get('.notification-list')
      .contains(`Booking ${bookingDatawithoutNotification.ref} has been created`)
      .should('not.exist')
    cy.get('#notificationId').click()

    // Removing booking
    removeBooking(bookingDatawithoutNotification)
  })
})
