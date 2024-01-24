import { additionalInfo, questions, file } from '../fixtures/truckerManagment/validData'
describe('Validate trucker managment tab', () => {
  before(() => {
    cy.visit('/settings')
    cy.wait(2000)
    cy.url().then(url => {
      if (!url.includes('/settings')) {
        cy.visit('/login')
        cy.userLogin(register[0].email, register[0].password)
      }
    })
  })
  it('add valid data', () => {
    cy.get('button[type="button"]')
      .should('be.visible')
      .contains('Trucker management')
      .click({ force: true })

    cy.get('.v-expansion-panels')
      .find('.v-expansion-panel-title :contains("Trucker requirements")')
      .parent()
      .click()
    additionalInfo?.forEach(info => {
      cy.getInputByLabel(info).check()
    })
    questions?.forEach(question => {
      cy.getInputByLabel('Question for trucker').type(question)
      cy.get('button[type="button"]').should('be.visible').find('.mdi-plus').click()
    })
    cy.get('button[type="submit"]').should('be.enabled').contains('Save').click()

    cy.get('.v-dialog').get('button[type="button"]').contains('Save').click()
    cy.get('.v-alert').contains('Trucker requirements saved')

    cy.get('.v-expansion-panels')
      .find('.v-expansion-panel-title :contains("Required onboarding documents")')
      .parent()
      .click()

    file.forEach(file => {
      cy.get('#fileUpload').selectFile(file.file, { force: true })
      cy.xpath('/html/body/div[2]/div/div[2]/div/div[2]/div/div[2]/div')
        .contains('Rename file')
        .should('be.visible')
      if (file.rename) {
        cy.getInputByLabel('File name').clear().type(file.rename)
      }
      cy.contains('button', 'rename').should('be.enabled').click()
      cy.get('.v-alert').contains('File was uploaded')
    })
  })

  it('edit added data', () => {
    additionalInfo?.forEach(info => {
      cy.getInputByLabel(info).uncheck()
    })

    cy.get('button[type="button"]').should('be.enabled').contains('Cancel changes').click()

    additionalInfo?.forEach(info => {
      cy.getInputByLabel(info).should('be.checked')
    })
    questions?.forEach(question => {
      cy.getInputByLabel('Question for trucker').type(question)
      cy.get('button[type="button"]').should('be.visible').find('.mdi-plus').click()
    })
    cy.get('button[type="submit"]').should('be.enabled').contains('Cancel changes').click()
  })
})
