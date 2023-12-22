import { validData } from '../fixtures/bookings'
import { editRowData, editBookingData } from '../fixtures/bookings/editData'

function fillBookingRef(ref) {
  cy.getInputByLabel('Booking ref*').type(ref)
}
function fillNoOfContainers(containers) {
  cy.getInputByLabel('Number of containers*').type(containers)
}
function fillBookingSSL(ssl) {
  cy.getInputByLabel('SSL *').type('{enter}', { force: true })
  cy.get('.v-overlay__content > .v-list > .v-list-item > .v-list-item__content')
    .contains(ssl)
    .click()
}
function fillBookingExpiry(expiry) {
  cy.get('.styleDatePicker[label="Booking expiry *"]')
    .click()
    .get('.v3dp__elements')
    .find('button')
    .filter(':visible')
    .contains(expiry.date)
    .should('be.visible')
    .click()
}
function fillPreferedCarrier(pcw) {
  cy.get('.styleDatePicker[label="Preferred carrier window"]')
    .click()
    .get('.v3dp__elements')
    .find('button')
    .filter(':visible')
    .contains(pcw.date)
    .should('be.visible')
    .click()
}

function fillBookingYard(yard) {
  cy.getInputByLabel('Yard label *').type('{enter}', { force: true })
  cy.get('.v-list-item-title').contains(yard).click()
}

function fillBookingEquipment(size) {
  cy.getInputByLabel('Equipment type*').click({ force: true })

  cy.get('.v-overlay__content > .v-list > .v-list-item > .v-list-item__content')
    .contains(size)
    .click()
}

function fillTruckerScac(truckerScac) {
  cy.get('input[placeholder="Choose truckers by SCAС *"]').type(truckerScac)
  cy.get('.v-overlay__content > .v-list > .v-list-item > .v-list-item__content')
    .contains(truckerScac)
    .click()
  // cy.get('.chipLabel').contains(data.TruckersScac).should('be.visible')
}

describe('Creating new Bookings', () => {
  before(() => {
    cy.visit('/login')
    cy.wait(3000)
    cy.url().then(url => {
      if (!url.includes('/dashboard')) {
        // If the URL doesn't contain '/dashboard', navigate to the dashboard route
        cy.visit('/login')
        cy.userLogin('sravanthi.gorantla@cognine.com', '123456789')
      }
    })
  })
  it('Create booking with valid data', () => {
    cy.contains('button', 'Create booking').should('be.visible').click()
    cy.get('.v-dialog').should('be.visible')

    validData.forEach(data => {
      cy.contains('Create booking')
      cy.get('button[type="submit"]').should('be.disabled').as('submitbutton').contains('Create')

      fillBookingRef(data.ref)
      fillNoOfContainers(data.noOfContainers)
      fillBookingSSL(data.ssl)
      fillBookingExpiry(data.expiry)
      fillPreferedCarrier(data.pcw)
      fillBookingYard(data.yard)
      fillBookingEquipment(data.equipmentType)
      fillTruckerScac(data.TruckersScac)

      cy.get('@submitbutton').should('be.enabled').click()
      cy.get('.v-alert').contains('Booking created')
      cy.searchDocData('bookings', 'ref', data.ref).then(docs => {
        expect(docs.length).to.be.at.least(1)
      })

      cy.get('.v-col[data-column="ref"]').last().contains(data.ref)
    })
  })

  it('Create booking and move to drafts', () => {
    cy.contains('button', 'Create booking').should('be.visible').click()
    cy.get('.v-dialog').should('be.visible')
    validData.forEach(data => {
      cy.contains('Create booking')
      cy.get('button[type="submit"]').should('be.disabled').as('submitbutton').contains('Create')

      fillBookingRef(data.ref)
      fillNoOfContainers(data.noOfContainers)
      fillBookingSSL(data.ssl)
      fillBookingExpiry(data.expiry)
      fillPreferedCarrier(data.pcw)
      fillBookingYard(data.yard)
      fillBookingEquipment(data.equipmentType)
      fillTruckerScac(data.TruckersScac)

      cy.getInputByLabel('Booking expiry *')
        .invoke('val')
        .then(sometext => cy.log(sometext))
      // cy.get('.v-overlay--active').click('left')
      cy.xpath('/html/body/div[2]/div[5]/div[2]/div/div[2]/div/div[2]/div/button').click({
        force: true,
      })
      // cy.get('.mdi-close').click({ force: true })
      cy.get('.v-dialog').should('have.length', 2)
      cy.contains('Do you want to keep the bookings in Drafts?')
      cy.get('button[type="button"]').contains('save').click()

      // cy.searchDataWithAnd('bookings', 'ref', data.ref).then(docs => {
      //   expect(docs.length).to.be.at.least(1)
      // })
    })
  })

  it.only('edit booking with valid data', () => {
    cy.wait(2000)
    cy.get('#bookingsTable')
      .get(`.v-col[data-column="ref"]`)
      .find(` :contains(${editRowData.ref})`)
      // .contains(editRowData.ref)
      .parentsUntil('.rowBorder')
      .find('.v-col[data-column="expiry"]')
      .contains(editRowData.expiry)
      .parentsUntil('.rowBorder')
      .as('selectedRow')

    cy.get('@selectedRow')

      .find('button')
      .as('actionbutton')
      .then(element => {
        if (element.length) {
          cy.log(element)
          cy.get('@actionbutton').click()
        } else {
          cy.get('@selectedRow').scrollTo('right').find('[class=mdi-dots-vertical]').click()
        }
      })
    cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Edit booking').click()
    cy.wait(1000)
    fillBookingSSL(editBookingData.ssl)

    cy.get('button[type="submit"]').contains('Save').click()
    cy.get('.v-dialog').get('button[type="button"]').contains('Save').click()
    cy.get('.v-alert').contains('Bookings updated')

    cy.get('@selectedRow').find('.v-col[data-column="ssl"]').find(`img[alt=${editBookingData.ssl}]`)
  })
})
