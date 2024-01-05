import { validData } from '../fixtures/register'
describe('remove user from firebase', () => {
  it('removing user record ', () => {
    cy.visit('/dashboard')
    cy.wait(3000)
    cy.logout()
    cy.removeUser(validData[0].email)
  })
})
