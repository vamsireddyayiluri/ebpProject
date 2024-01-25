import { scacData, invalidScac, emailData } from '../fixtures/preferredTruckers/validData'
import { validData as register } from '../fixtures/register'

describe('Validate preferred truckers tab', () => {
  before(() => {
    cy.visit('/settings')
    cy.wait(3000)
    cy.url().then(url => {
      if (!url.includes('/settings')) {
        cy.visit('/login')
        cy.userLogin(register[0].email, register[0].password)
        cy.visit('/settings')
      }
    })
  })
  it('Verify adding existing scac', () => {
    cy.get('button[type="button"]')
      .should('be.visible')
      .contains('Preferred truckers list')
      .click({ force: true })
    cy.getInputByLabel('Search for truckers by SCAC and email').type(scacData[0])
    cy.get('button[type="button"]').should('be.visible').find('.mdi-plus').click()
    cy.get('body').click(50, 50, { force: true })
    cy.getInputByLabel('Search for truckers by SCAC and email').clear()
    cy.get('#truckersListTable').find('.vue-recycle-scroller').contains(scacData[0])
  })
  it('Verify searching non existing scac', () => {
    cy.getInputByLabel('Search for truckers by SCAC and email').type(invalidScac[0])
    cy.get('.pa-6')
      .find('.text-body-m-regular')
      .contains(
        'There is no such trucker on the platform. Do you want to send an invitation via email?',
      )
    cy.get('button[type="button"]').should('be.visible').contains('Invite new trucker').click()
    cy.get('.v-card').contains('Invite trucker')
    cy.getInputByLabel('Email').type(emailData[0])
    cy.get('button[type="button"]').should('be.enabled').contains('Save').click()
    cy.get('.v-alert').contains('The invitation has been sent!')
    cy.getInputByLabel('Search for truckers by SCAC and email').clear()
  })
  it('Delete trucker added in preferred list', () => {
    cy.get('#truckersListTable')
      .get(`.v-col[data-column="scacEmail"]`)
      .find(`:contains(${scacData[0]})`)
      .parent()
      .parent()
      .as('selectedRow')

    cy.get('@selectedRow').find('button').as('actionbutton').click()
    cy.get('.v-list').find('.mdi-delete').click()
    cy.get('.v-card').contains('Are you sure you want to remove trucker')
    cy.get('button[type="button"]').should('be.enabled').contains('Delete').click()
  })
  it('Invite new trucker by clicking invite new trucker button', () => {
    cy.get('button[type="button"]').should('be.enabled').contains('Invite new trucker').click()
    cy.get('.v-card').contains('Invite trucker')
    cy.getInputByLabel('Email').type(emailData[0])
    cy.get('button[type="button"]').should('be.enabled').contains('Save').click()
    cy.get('.v-alert').contains('The invitation has been sent!')
  })
})
