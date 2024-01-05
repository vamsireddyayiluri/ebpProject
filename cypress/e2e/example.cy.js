// https://docs.cypress.io/api/introduction/api.html
describe('My First Test', () => {
  it('visits the app root url', () => {
    cy.visit('/register')

    // cy.callFirestore('get', 'users').then(doc => {
    //   cy.log('document user', doc)
    // })
    cy.getUsersData('sravanthi.gorantla@cognine.com').then(doc => {
      cy.log('user document', doc)
    })

    // cy.verifyEmailAddress('sravanthi.gorantla@cognine.com', '123456789').then(val => {
    //   cy.log('var', val)
    // })
    // cy.contains('h1', 'You did it!')
  })
})
