import { rulesData as data } from '../fixtures/bookingRules/validData'
import { invalidData } from '../fixtures/bookingRules/invalidData'
describe('validate booking rules', () => {
  before(() => {
    cy.visit('/settings')
    cy.wait(4000)
    cy.url().then(url => {
      if (!url.includes('/settings')) {
        // If the URL doesn't contain '/dashboard', navigate to the dashboard route
        cy.visit('/login')
        cy.userLogin('sravanthi.gorantla@cognine.com', '123456789')
      }
    })
  })
  it('add and remove trucker scacs in booking rules', () => {
    cy.url().then(url => {
      if (!url.includes('/settings')) {
        cy.visit('/settings')
      }
    })

    cy.getInputByLabel('Address').type(data.address).as('adressref')
    cy.wait(1000)
    cy.get('@adressref').type('{downArrow}{downArrow}')

    cy.getInputByLabel('Location label').type(data.addressLabel)

    if (data.commodity) {
      cy.getInputByLabel('Commodities that you export').type(data.commodity)
    }
    cy.contains('button', ' Add ').should('be.enabled').click()
    cy.get('.styleLocationItems')
      .find(`.styleChip`)
      .contains(data.addressLabel)
      .should('be.visible')

    cy.contains('button', 'Save').should('be.enabled').click()

    cy.get('.v-dialog').get('button[type="button"]').contains('Save').click()
    cy.get('.v-alert').contains('Work details saved!')

    cy.get('button[type="button"]').should('be.visible').contains('Booking rules').click()

    cy.getInputByLabel('Set yard by default').click({ force: true })

    cy.get('.v-list-item-title')
      .contains(new RegExp(`^${data.addressLabel}$`, 'gi'))
      .click()

    cy.getInputByLabel(
      'Set the time between the preferred carrier window and time before cutoff by default',
    ).type(data.preferredCarrierDefault)

    cy.get('input[placeholder="Choose truckers by SCAС *"]').type(data.truckerScac)
    cy.get('.v-overlay__content > .v-list > .v-list-item > .v-list-item__content')
      .contains(data.truckerScac)
      .click()
    // cy.get('.chipLabel').contains(data.truckerScac).should('be.visible')
    cy.getInputByLabel('Set the time for notification before cutoff date by default').type(
      data.notificationCutoffDays,
    )

    cy.contains('button', 'Save').should('be.enabled').click()

    cy.get('.v-dialog').get('button[type="button"]').contains('Save').click()
    cy.get('.v-alert').contains('Booking rules updated')

    cy.get('a[href="/dashboard"]').should('be.visible').click()

    cy.contains('button', 'Create booking').should('be.visible').click()
    cy.get('.v-dialog').should('be.visible')

    cy.get('.styleDatePicker[label="Booking Expiration *"]')
      .click()
      .get('.v3dp__elements')
      .find('button')
      .filter(':visible')
      .contains(data.expiryDate)
      .click({ force: true })

    cy.getInputByLabel('Preferred carrier window')
      .invoke('val')
      .then(sometext => {
        console.log('Sometext', sometext)
      })

    cy.getInputByLabel('Yard label *')
      .siblings()
      .find('.v-select__selection-text')
      .should('have.text', data.addressLabel)

    cy.get('.chipLabel').contains(data.truckerScac).should('be.visible')
  })

  it('booking rules with invliad data', () => {
    cy.url().then(url => {
      if (!url.includes('/settings')) {
        cy.visit('/settings')
      }
    })

    cy.contains('button', ' Add ').should('be.disabled')

    cy.contains('button', 'Save').should('be.disabled')

    cy.get('.styleLocationItems')
      .find(`.styleChip`)
      .contains(new RegExp(`^${data.addressLabel}$`, 'gi'))
      .should('be.visible')
      .siblings()
      .find('button')
      .click()

    cy.get('.v-dialog').get('button[type="button"]').contains('Remove').click()

    cy.contains('button', 'Save').should('be.enabled').click()

    cy.get('.v-dialog').get('button[type="button"]').contains('Save').click()

    cy.get('.v-alert').contains('Work details saved!')

    cy.get('button[type="button"]').should('be.visible').contains('Booking rules').click()

    cy.get('button[type="submit"]').as('saverules').contains('Save')
    cy.get('@saverules').should('be.disabled')

    cy.getInputByLabel('Set yard by default')
      .siblings()
      .find('.v-select__selection-text')
      .should('have.text', '')

    cy.getInputByLabel(
      'Set the time between the preferred carrier window and time before cutoff by default',
    )
      .as('preferedCutOff')
      .clear()
    cy.get('@saverules').should('be.enabled')

    cy.get('@preferedCutOff').type(invalidData.preferredCarrierDefault)
    cy.get('@saverules').should('be.disabled')

    cy.get('button[type="button"]')
      .contains('Cancel changes')
      .as('cancelRules')
      .should('be.enabled')
      .click()

    cy.get('@preferedCutOff').should('have.text', data.preferredCarrierDefault)

    cy.getInputByLabel('Set the time for notification before cutoff date by default')
      .as('notificationCutOff')
      .clear()
    cy.get('@saverules').should('be.enabled')

    cy.get('@notificationCutOff').type(invalidData.notificationCutoffDays)
    cy.get('@saverules').should('be.disabled')
  })
})
