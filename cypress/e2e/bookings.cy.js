import { validData } from '../fixtures/bookings'
describe('Creating new Bookings', () => {
  it('Create booking with valid data', () => {
    cy.visit('/login')
    cy.wait(3000)
    cy.url().then(url => {
      if (!url.includes('/dashboard')) {
        // If the URL doesn't contain '/dashboard', navigate to the dashboard route
        cy.visit('/login')
        cy.userLogin('sravanthi.gorantla@cognine.com', '123456789')
      }
    })

    cy.contains('button', 'Create booking').should('be.visible').click()
    cy.get('.v-dialog').should('be.visible')

    validData.forEach(data => {
      cy.contains('Create booking')
      cy.get('button[type="submit"]').should('be.disabled').as('submitbutton').contains('Create')
      cy.getInputByLabel('Booking ref*').type(data.ref)
      cy.getInputByLabel('Number of containers*').type(data.noOfContainers)
      cy.getInputByLabel('SSL *').type('{enter}', { force: true })
      cy.contains(data.ssl).click()
      cy.get('.styleDatePicker[label="Booking expiry *"]')
        .click()
        .contains(data.expiry.date)
        .should('be.visible')
        .click()
      cy.get('.styleDatePicker[label="Preferred carrier window"]')
        .click()
        .contains(data.pcw.date)
        .should('be.visible')
        .click()

      cy.getInputByLabel('Yard label *').type('{enter}', { force: true })
      cy.get('.v-list-item-title').contains(data.yard).click()
      cy.getInputByLabel('Equipment type*').type(data.equipmentType)
      cy.get('input[placeholder="Choose truckers by SCAС *"]').type(data.TruckersScac)
      cy.contains(data.TruckersScac).click()
      cy.get('.chipLabel').contains(data.TruckersScac).should('be.visible')
      cy.get('@submitbutton').should('be.enabled').click()
      cy.get('.v-alert').contains('Booking created')
      cy.searchDocData('bookings', 'ref', data.ref).then(docs => {
        expect(docs.length).to.be.at.least(1)
      })

      cy.get('.v-col[data-column="ref"]').last().contains(data.ref)
    })
  })
})
