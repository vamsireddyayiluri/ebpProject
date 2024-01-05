import { validData } from '../fixtures/register'

describe('check email verification functionality', () => {
  it('try login without verification', () => {
    cy.visit('/login')
    cy.wait(3000)
    cy.url().should('include', 'verify1')
    cy.visit('/dashboard')
    cy.wait(3000)
    cy.url().should('include', 'verify1')
  })
  it('creating user account', () => {
    cy.url().then(url => {
      if (!url.includes('/verify1')) {
        // If the URL doesn't contain '/dashboard', navigate to the dashboard route
        cy.visit('/login')
        cy.userLogin(validData[0].email, validData[0].password)
      }
    })
    cy.url().should('include', '/verify1')

    cy.verifyEmail(validData[0].email).then(val => {
      cy.log('var', val)
      cy.visit(val)
    })
    cy.wait(9000)
    cy.searchDocData('users', 'email', validData[0].email).then(docs => {
      expect(docs.length).to.be.at.least(1)
    })
    cy.contains('button', 'Create booking').should('be.visible')
  })
})
