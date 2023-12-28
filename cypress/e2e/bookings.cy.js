import { validData } from '../fixtures/bookings'
import {
  editRowData,
  editBookingData,
  removeBooking,
  draftRowData,
  filterData,
} from '../fixtures/bookings/editData'

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
  cy.get('.styleDatePicker[label="Booking Expiration *"]')
    .click()
    .get('.v3dp__elements')
    .find('button')
    .filter(':visible')
    .contains(expiry.date)
    // .should('be.visible')
    .click({ force: true })
}
function fillPreferedCarrier(pcw) {
  cy.get('.styleDatePicker[label="Preferred carrier window"]')
    .click()
    .get('.v3dp__elements')
    .find('button')
    .filter(':visible')
    .contains(pcw.date)
    // .should('be.visible')
    .click({ force: true })
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

function clearFieldData(field) {
  cy.getInputByLabel(field).clear()
}

describe('Creating new Bookings', () => {
  before(() => {
    cy.visit('/login')
    cy.wait(4000)
    cy.url().then(url => {
      if (!url.includes('/dashboard')) {
        // If the URL doesn't contain '/dashboard', navigate to the dashboard route
        cy.visit('/login')
        cy.userLogin('qualle.cogninetest@ezztt.com', '1234567890')
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
      cy.getInputByLabel('Booking Expiration *')
        .invoke('val')
        .then(sometext => {
          cy.wrap(sometext).as('expiry')
        })

      cy.get('@submitbutton').should('be.enabled').click()
      cy.wait(2000)
      cy.get('.v-alert').contains('Booking created')
      cy.get('@expiry').then(sometext => {
        cy.searchDataWithTwoLables('bookings', 'ref', data.ref, 'bookingExpiry', sometext).then(
          docs => {
            expect(docs.length).to.be.at.least(1)
          },
        )
      })

      // cy.get('.v-col[data-column="ref"]').last().contains(data.ref)
    })
  })

  it('create booking with invalid data', () => {
    cy.contains('button', 'Create booking').should('be.visible').click()
    cy.get('.v-dialog').should('be.visible')
    validData.forEach(data => {
      cy.contains('Create booking')
      cy.get('button[type="submit"]').should('be.disabled').as('submitbutton').contains('Create')

      fillBookingRef(data.ref)
      cy.get('@submitbutton').should('be.disabled')
      fillNoOfContainers(data.noOfContainers)
      cy.get('@submitbutton').should('be.disabled')
      fillBookingSSL(data.ssl)
      cy.get('@submitbutton').should('be.disabled')
      fillBookingExpiry(data.expiry)
      cy.get('@submitbutton').should('be.disabled')
      fillPreferedCarrier(data.pcw)
      cy.get('@submitbutton').should('be.disabled')
      fillBookingYard(data.yard)
      cy.get('@submitbutton').should('be.disabled')
      fillBookingEquipment(data.equipmentType)
      cy.get('@submitbutton').should('be.enabled')

      clearFieldData('Booking ref*')
      cy.get('@submitbutton').should('be.disabled')
      fillBookingRef(data.ref)
      cy.get('@submitbutton').should('be.enabled')
      clearFieldData('Number of containers*')
      cy.get('@submitbutton').should('be.disabled')
      fillNoOfContainers(data.noOfContainers)
      cy.get('@submitbutton').should('be.enabled')

      cy.xpath('/html/body/div[2]/div[5]/div[2]/div/div[2]/div/div[2]/div/button').click({
        force: true,
      })
      cy.get('.v-dialog').should('have.length', 2)
      cy.contains('Do you want to keep the bookings in Drafts?')
      cy.get('button[type="button"]').contains('cancel').click()
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

      cy.getInputByLabel('Booking Expiration *')
        .invoke('val')
        .then(sometext => {
          cy.wrap(sometext).as('expiry')
        })

      // cy.get('.v-overlay--active').click('left')
      cy.xpath('/html/body/div[2]/div[5]/div[2]/div/div[2]/div/div[2]/div/button').click({
        force: true,
      })
      // cy.get('.mdi-close').click({ force: true })
      cy.get('.v-dialog').should('have.length', 2)
      cy.contains('Do you want to keep the bookings in Drafts?')
      cy.get('button[type="button"]').contains('save').click()

      cy.get('@expiry').then(sometext => {
        cy.searchDataWithTwoLables('drafts', 'ref', data.ref, 'bookingExpiry', sometext).then(
          docs => {
            expect(docs.length).to.be.at.least(1)
          },
        )
      })
    })
  })

  it('edit booking with valid data', () => {
    cy.wait(2000)
    cy.get('#bookingsTable')
      .get(`.v-col[data-column="ref"]`)

      .find(`:contains(${editRowData.ref})`)

      .parent()
      .parent()
      .find(`.v-col[data-column="expiry"] :contains(${editRowData.expiry})`)
      .parent()
      .parent()
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
    if (editBookingData?.ssl) {
      fillBookingSSL(editBookingData.ssl)
    }
    if (editBookingData.equipmentType) {
      fillBookingEquipment(editBookingData.equipmentType)
    }

    cy.get('button[type="submit"]').contains('Save').click()
    cy.get('.v-dialog').get('button[type="button"]').contains('Save').click()
    cy.get('.v-alert').contains('Bookings updated')

    // cy.get('@selectedRow').find('.v-col[data-column="ssl"]').find(`img[alt=${editBookingData.ssl}]`)
  })

  it('Remove Booking from the network', () => {
    cy.wait(2000)
    cy.get('#bookingsTable')
      .get(`.v-col[data-column="ref"]`)
      .find(` :contains(${editRowData.ref})`)
      .parent()
      .parent()
      .find(`.v-col[data-column="expiry"] :contains(${editRowData.expiry})`)
      .parent()
      .parent()
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
    cy.get('button[type="button"]')
      .should('be.visible')
      .as('removeNetwork')
      .contains('Remove from network')
      .click()

    cy.searchDataWithTwoLables(
      'drafts',
      'ref',
      editRowData.ref,
      'bookingExpiry',
      editRowData.expiry,
    ).then(docs => {
      expect(docs.length).to.be.at.least(1)
    })
  })

  it('Move Booking from drafts to bookings', () => {
    cy.wait(2000)

    cy.get('button[type="button"]').contains('Drafts').click()
    cy.get('button[type="button"]').contains('Map').should('be.visible').click()
    cy.get('#draftTable')
      .get(`.v-col[data-column="ref"]`)
      .find(`:contains(${draftRowData.ref})`)
      .parent()
      .parent()
      .find(`.v-col[data-column="expiry"] :contains(${draftRowData.expiry})`)
      .parent()
      .parent()
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
    cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Edit').click()
    cy.wait(1000)

    cy.get('button[type="button"]').should('be.visible').as('publish').contains('publish').click()

    cy.get('.v-alert').contains('Draft was deleted').should('be.visible')

    cy.searchDataWithTwoLables(
      'bookings',
      'ref',
      draftRowData.ref,
      'bookingExpiry',
      draftRowData.expiry,
    ).then(docs => {
      expect(docs.length).to.be.at.least(1)
    })
  })

  it('add Validations to the filters', () => {
    cy.wait(1000)
    cy.get('input[placeholder="Search..."]').type(filterData.search)
    cy.wait(1000)
    cy.get('#bookingsTable')
      .find('.vue-recycle-scroller__item-wrapper ')

      .as('tableBody')
      .then(ele => {
        if (ele.length && ele.is(':visible')) {
          cy.get('@tableBody').contains(filterData.search)
        } else {
          cy.get('#bookingsTable').contains(' No results ').should('be.visible')
        }
      })

    cy.get('.v-field__clearable').should('be.visible').first().click()
    cy.get

    cy.getInputByLabel('SSL').click({ force: true })
    cy.get('.v-overlay__content > .v-list > .v-list-item > .v-list-item__content')
      .contains(filterData.ssl)
      .click()
    cy.wait(1000)
    cy.get('#bookingsTable')
      .find('.vue-recycle-scroller__item-wrapper ')

      .as('tableBody')
      .then(ele => {
        if (ele.length && ele.is(':visible')) {
          cy.get('@tableBody').find('.v-col[data-column="ssl"]').find(`img[alt=${filterData.ssl}]`)
        } else {
          cy.get('#bookingsTable').contains(' No results ').should('be.visible')
        }
      })
  })

  it('Validate booking buttons', () => {
    cy.contains('button', 'Create booking').should('be.visible')

    cy.get('button[type="button"]').contains('Map').should('be.visible').click()

    cy.get('button[type="button"]').contains('Booking').click()

    cy.get('button[type="button"]').contains('Create booking').should('be.visible')
    cy.get('button[type="button"]').contains('Map').should('be.visible').click()

    cy.get('button[type="button"]').contains('Yards').click()

    cy.get('button[type="button"]').contains('Create booking').should('be.visible')
    cy.get('button[type="button"]').contains('Map').should('be.visible').click()

    cy.get('button[type="button"]').contains('Drafts').click()

    cy.get('button[type="button"]').contains('Create booking').should('be.visible')
    cy.get('button[type="button"]').contains('Map').should('be.visible').click()
  })

  it('Remove booking', () => {
    cy.wait(2000)
    cy.get('button[type="button"]').contains('Map').should('be.visible').click()
    cy.get('#bookingsTable')
      .get(`.v-col[data-column="ref"]`)
      .find(` :contains(${removeBooking.ref})`)
      .parent()
      .parent()
      .find(`.v-col[data-column="expiry"] :contains(${removeBooking.expiry})`)
      .parent()
      .parent()
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
    cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Remove booking').click()

    cy.get('.v-dialog').should('be.visible')

    cy.get('button[type="button"]').contains('Remove').click()

    cy.get('.v-alert').contains('Bookings removed!')

    cy.searchDataWithTwoLables(
      'bookings',
      'ref',
      removeBooking.ref,
      'bookingExpiry',
      removeBooking.expiry,
    ).then(docs => {
      expect(docs.length).to.be.at.least(0)
    })
  })
})
