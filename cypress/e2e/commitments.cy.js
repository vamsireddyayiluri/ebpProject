import {
  commitmentData,
  truckerCompany1,
  truckerCompany2,
} from '../fixtures/commitments'

const getSelectedCommitmentRow = (commitmentData, truckerCompany) => {
  cy.get('#bookingsTable')
    .get(`.v-col[data-column="ref"]`)
    .find(`:contains(${commitmentData.bookingRef})`)
    .parent()
    .parent()
    .find(`.v-col[data-column="bookingExpiry"] :contains(${commitmentData.expiryDate})`)
    .parent()
    .parent()
    .as('selectedRow')

  cy.get('@selectedRow').find('button').find('.mdi-chevron-down').click()

  cy.get('@selectedRow').siblings().as('commitmentTable')
  cy.get('@commitmentTable')
    .get(`.v-col[data-column="trucker"]`)
    .find(`:contains(${truckerCompany.truckerScac})`)
    .parent()
    .parent()
    .find(`.v-col[data-column="committed"] :contains(${commitmentData.committedCount})`)
    .parent()
    .parent()
    .as('committmentRow')
}
describe('Create commitments to booking', () => {
  before(() => {
    cy.visit('/login')
    cy.wait(4000)
    cy.url().then(url => {
      if (!url.includes('/dashboard')) {
        // If the URL doesn't contain '/dashboard', navigate to the dashboard route
        cy.visit('/login')

        // cy.userLogin(register[0].email, register[0].password)

        cy.userLogin('sravanthi.gorantla@cognine.com', '1234567890')
        cy.wait(2000)
      }
    })
  })
  it('Check if the exporter can accept the pending commitment from trucker details', () => {
    cy.createCommitment({ ...commitmentData, ...truckerCompany1 })
    cy.reload()
    cy.wait(1000)
    cy.get('button[type="button"]').contains('Map').should('be.visible').click()

    getSelectedCommitmentRow(commitmentData, truckerCompany1)

    cy.get('@committmentRow').find(`.v-col[data-column="status"]`).should('contain', 'pending')
    cy.get('@committmentRow').find('button').find('.mdi-dots-vertical').click()
    cy.get('.v-overlay__content > .v-list > .v-list-item')
      .contains('View trucker details')
      .should('be.visible')
      .click()

    // check trucker details on pending status

    cy.get('.v-overlay__content > .v-card')
      .as('detailsCard')
      .should('contain', 'Commitment details')
      .and('contain', 'Timeline')

    cy.get('@detailsCard')
      .find('.v-card')
      .should('contain', 'Trucker details')
      .and('contain', 'Booking details')
      .and('be.visible')
      .as('commitmentCard')

    // cy.get('@commitmentCard')
    //   .find('.v-expansion-panels > .v-expansion-panel > .v-expansion-panel-text')
    //   .first()
    //   .find('.v-col')
    //   .should('not.contain', 'Secondary name')
    //   .and('not.contain', 'Secondary number')
    //   .and('not.contain', 'Contact number')
    //   .and('not.contain', 'Name')

    // cy.get('@commitmentCard')
    //   .find('v-expansion-panels > v-expansion-panel')
    //   .last()
    //   .as('bookingDetails')
    //   .click()

    // cy.get('@bookingDetails')
    //   .find('v-expansion-panel-text')
    //   .find('.variant-status')
    //   .contains('pending', { matchCase: false })

    // *****

    cy.get('@detailsCard')
      .find('button[type="button"]')
      .contains('decline', { matchCase: false })
      .should('be.visible')
    cy.get('@detailsCard')
      .find('button[type="button"]')
      .contains('approve', { matchCase: false })
      .should('be.visible')
      .click()
    cy.get('@detailsCard').should('not.exist')
    cy.wait(1000)
    cy.get('@committmentRow').find(`.v-col[data-column="status"]`).should('contain', 'approved')

    // Complete commitment
    cy.get('@committmentRow').find('button').find('.mdi-dots-vertical').click()

    cy.get('.v-overlay__content > .v-list > .v-list-item').contains('View trucker details').click()

    // check trucker details on aproved status

    cy.get('.v-overlay__content > .v-card')
      .as('detailsCard')
      .should('contain', 'Commitment details')
      .and('contain', 'Timeline')

    cy.get('@detailsCard')
      .find('.v-card')
      .should('contain', 'Trucker details')
      .and('contain', 'Booking details')
      .and('be.visible')
      .as('commitmentCard')

    cy.get('@commitmentCard')
      .find('.v-expansion-panels > .v-expansion-panel > .v-expansion-panel-text')
      .first()
      .find('.v-col')
      .should('contain', 'Secondary name')
      .and('contain', 'Secondary number')
      .and('contain', 'Contact number')
      .and('contain', 'Name')

    cy.get('@commitmentCard')
      .find('.v-expansion-panels > .v-expansion-panel')
      .last()
      .as('bookingDetails')
      .click()

    cy.get('@bookingDetails')
      .find('.v-expansion-panel-text')
      .find('.variant-status')
      .contains('approved', { matchCase: false })

    cy.get('.v-overlay__content > .v-card')
      .as('approveDetailsCard')
      .should('contain', 'Commitment details')
      .and('contain', 'Timeline')

    cy.get('@approveDetailsCard')
      .find('button[type="button"]')
      .contains('complete', { matchCase: false })
      .should('be.visible')
      .click()

    // ****//

    cy.get('.v-dialog').should('have.length', 2)

    cy.get('.v-overlay__content').last().as('completeCommitmentDialog')
    cy.get('@completeCommitmentDialog')
      .find('button[type="button"]')
      .should('be.disabled')
      .and('be.visible')
      .contains('confirm')
      .as('confirm')
    cy.get('@completeCommitmentDialog').find('.v-select').should('be.visible').click()
    cy.get('.v-overlay__content > .v-list > .v-list-item')
      .contains('onboarded', { matchCase: false })
      .click()
    cy.get('@completeCommitmentDialog')
      .find('button[type="button"]')
      .contains('confirm', { matchCase: false })
      .should('be.visible')
      .click()
    cy.get('@committmentRow').find(`.v-col[data-column="status"] `).should('contain', 'onboarded')
  })

  it('Create commitment with valid data', () => {
    cy.createCommitment({ ...commitmentData, ...truckerCompany2 })
    cy.reload()
    cy.wait(1000)
  })
  it('Check if the request load by trucker is displayed as pending commitment for the booking and approve ', () => {
    cy.get('button[type="button"]').contains('Map').should('be.visible').click()

    getSelectedCommitmentRow(commitmentData, truckerCompany2)

    // cy.get('@selectedRow').find(`.v-col[data-column="progress"]`).first().contains('0%')

    cy.get('@committmentRow').find(`.v-col[data-column="status"] `).should('contain', 'pending')

    cy.get('@committmentRow').find('button').find('.mdi-dots-vertical').click()

    cy.get('.v-overlay__content > .v-list > .v-list-item')
      .should('contain', 'Decline')
      .and('contain', 'View trucker details')
      .and('contain', 'Approve')
      .and('have.length', 3)

    cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Approve').click()
    cy.get('@committmentRow').find(`.v-col[data-column="status"]`).should('contain', 'approved')

    // completing commitment

    cy.get('@committmentRow').find('button').find('.mdi-dots-vertical').click()

    cy.get('.v-overlay__content > .v-list > .v-list-item')
      .should('contain', 'Complete commitment')
      .and('contain', 'View trucker details')
      .and('have.length', 2)

    cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Complete commitment').click()
    cy.get('.v-overlay__content > .v-card')
      .as('completeCommitmentDialog')
      .contains('complete commitment', { matchCase: false })
    cy.get('@completeCommitmentDialog')
      .find('button[type="button"]')
      .should('be.disabled')
      .contains('confirm')
      .as('confirm')

    cy.get('@completeCommitmentDialog').find('.v-select').click()
    cy.get('.v-overlay__content > .v-list > .v-list-item')
      .contains('Onboarded', { matchCase: true })
      .click()
    cy.get('@confirm').click()
    cy.get('@committmentRow').find(`.v-col[data-column="status"] `).should('contain', 'onboarded')
  })

  it('decline pending commitment', () => {
    cy.createCommitment({ ...commitmentData, ...truckerCompany1 })

    cy.reload()
    cy.wait(1000)
    cy.get('button[type="button"]').contains('Map').should('be.visible').click()

    cy.get('#bookingsTable')
      .get(`.v-col[data-column="ref"]`)
      .find(`:contains(${commitmentData.bookingRef})`)
      .parent()
      .parent()
      .find(`.v-col[data-column="bookingExpiry"] :contains(${commitmentData.expiryDate})`)
      .parent()
      .parent()
      .as('selectedRow')

    cy.get('@selectedRow').find('button').find('.mdi-chevron-down').click()

    cy.get('@selectedRow').siblings().as('commitmentTable')
    cy.get('@commitmentTable')
      .get(`.v-col[data-column="trucker"]`)
      .find(`:contains(${truckerCompany1.truckerScac})`)
      .parent()
      .parent()
      .find(`.v-col[data-column="status"] :contains('pending')`)
      .parent()
      .parent()
      .as('committmentRow')

    cy.get('@committmentRow').find('button').find('.mdi-dots-vertical').click()
    cy.get('.v-overlay__content > .v-list > .v-list-item')
      .contains('Decline')
      .should('be.visible')
      .click()

    cy.get('.v-dialog').should('be.visible')
    cy.get('.v-overlay__content > .v-card ')
      .as('declineDialog')
      .contains('Decline commitment')
      .should('be.visible')
    cy.get('@declineDialog').find('button[type="button"]').should('be.disabled').contains('decline')
    cy.get('@declineDialog').find('.v-select').click()
    cy.get('.v-overlay__content > .v-list > .v-list-item')
      .contains('Booking rolled', { matchCase: false })
      .should('be.visible')
      .click()
    cy.get('@declineDialog').find('.mdi-close').click()

    cy.get('@committmentRow').find('button').find('.mdi-dots-vertical').click()
    cy.get('.v-overlay__content > .v-list > .v-list-item')
      .contains('View trucker details')
      .should('be.visible')
      .click()
    cy.get('.v-dialog').should('be.visible')

    cy.get('.v-overlay__content > .v-card')
      .as('commitmentDetailsCard')
      .should('contain', 'Commitment details')
      .and('contain', 'Timeline')
      .and('contain', 'approve')

    cy.get('.v-overlay__content > .v-card')
      .find('button[type="button"]')
      .contains('decline')
      .should('be.visible')
      .click()
    cy.get('.v-dialog').should('have.length', 2).last().as('declineDialog')
    cy.get('@declineDialog').contains('Decline commitment')

    cy.get('@declineDialog').find('button[type="button"]').should('be.disabled').contains('decline')
    cy.get('@declineDialog').find('.v-select').click()
    cy.get('.v-overlay__content > .v-list > .v-list-item')
      .contains('Booking rolled', { matchCase: false })
      .should('be.visible')
      .click()

    cy.get('@declineDialog')
      .find('button[type="button"]')
      .should('be.enabled')
      .contains('decline')
      .click()
    cy.get('.v-dialog').should('not.exist')
  })
})
