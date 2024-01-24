import {
  additionalInfo,
  questions,
  file,
  declineReasons,
  fileNames,
} from '../fixtures/truckerManagment/validData'
import { validData as register } from '../fixtures/register'

describe('Validate trucker managment tab', () => {
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
  it('Add valid data', () => {
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
    cy.get('.v-alert').find('.mdi-close').click()

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
      cy.get('.v-alert').find('.mdi-close').click()

      cy.get('.v-expansion-panels')
        .find('.v-expansion-panel-title :contains("Required onboarding documents")')
        .parent()
        .click()
    })
  })

  it('Cancel edit changes', () => {
    additionalInfo?.forEach(info => {
      cy.getInputByLabel(info).uncheck()
    })

    questions?.forEach(question => {
      cy.getInputByLabel('Question for trucker').type(question)
      cy.get('button[type="button"]').should('be.visible').find('.mdi-plus').click()
    })
    cy.get('button[type="button"]').should('be.enabled').contains('Cancel changes').click()
    additionalInfo?.forEach(info => {
      cy.getInputByLabel(info).should('be.checked')
    })
  })
  it('Accept onboarding documents', () => {
    cy.get('.v-expansion-panels').find('.v-expansion-panel-title :contains("Onboarding")').parent()
    cy.get('#truckersDocumentsTable').find('.v-chip').contains(fileNames[1]).click()
    cy.get('.v-card').get('button[type="button"]').contains('accept').click()
  })

  it('Close onboarding documents file', () => {
    cy.get('.v-expansion-panels').find('.v-expansion-panel-title :contains("Onboarding")').parent()
    cy.get('#truckersDocumentsTable').find('.v-chip').contains(fileNames[1]).click()
    cy.get('.v-card').find('.mdi-close').click()
  })
  it('Download onboarding documents file', () => {
    cy.get('.v-expansion-panels').find('.v-expansion-panel-title :contains("Onboarding")').parent()
    cy.get('#truckersDocumentsTable').find('.v-chip').contains(fileNames[0]).click()
    cy.get('.v-card').find('.mdi-download').click()
    cy.get('.v-card').find('.mdi-close').click()
  })
  it('Decline onboarding documents', () => {
    cy.get('.v-expansion-panels').find('.v-expansion-panel-title :contains("Onboarding")').parent()
    cy.get('#truckersDocumentsTable').find('.v-chip').contains(fileNames[0]).click()
    cy.get('.v-card').get('button[type="button"]').contains('decline').click()
    cy.get('.v-card').contains('Leave comment')
    cy.getInputByLabel('Explain what is wrong').type(declineReasons[0])
    cy.get('button[type="button"]').contains('send').click()
    cy.get('.v-card').find('.mdi-close').click()
  })
})
