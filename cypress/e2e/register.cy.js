import { validData } from '../fixtures/register'

import { accountData, optionalDetailsWithNull } from '../fixtures/register/inValidData'

//  fill all account details
const fillAccountDetails = data => {
  cy.getInputByLabel('Full name *').type(data.name).should('have.attr', 'required')
  cy.getInputByLabel('Email *').type(data.email)
  cy.getInputByLabel('Company name *').type(data.company)
  cy.getInputByLabel('Work phone *').type(data.phoneNumber)
  cy.getInputByLabel('Password *').type(data.password)
  cy.getInputByLabel('Confirm password *').type(data.confirmPassword)
}

// filling work detials step
const fillWorkdetails = data => {
  cy.getInputByLabel('Address').type(data.address).as('adressref')
  cy.wait(1000)
  cy.get('@adressref').type('{downArrow}{downArrow}')

  cy.getInputByLabel('Location label').type(data.addressLabel)
  if (data.commodity) {
    cy.getInputByLabel('Commodities that you export').type(data.commodity)
  }
  cy.contains('button', ' Add ').should('be.enabled').click()
  cy.getInputByLabel('Address').clear()

  cy.get('.styleChip').contains(data.addressLabel)
}

// filling invite team step
const fillInviteTeam = data => {
  cy.getInputByLabel('Email').type(data.email)
  cy.get('.v-field__append-inner > .mdi-chevron-down').type('{downArrow}{enter}')

  cy.getInputByLabel('Worker ID').type(data.workerId)

  cy.contains('button', 'add member').should('be.enabled').click()
  cy.wait(1000)
  cy.get('.styledMemberItems').contains(data.workerId)
}

// filling trucker requirments
const fillTruckerRequirments = data => {
  data?.truckerScac?.forEach(scac => {
    cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[2]/div[1]/div[3]/div/div')
      .type(scac)
      .type('{downarrow}{enter}')
  })
  data?.additionalInfo?.forEach(info => {
    cy.getInputByLabel(info).check()
  })
  data?.questions?.forEach(question => {
    cy.getInputByLabel('Question for trucker').type(question)
    cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[2]/div[1]/div[8]/button').click()
  })
}

// uploading onboarding documnets
const onBoardDocuments = data => {
  data?.documents?.forEach(doc => {
    cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[2]/div[1]/label').selectFile(doc.file)
    cy.xpath('/html/body/div[2]/div/div[2]/div/div[2]/div/div[2]/div')
      .contains('Rename file')
      .should('be.visible')
    if (doc.rename) {
      cy.getInputByLabel('File name').clear().type(doc.rename)
    }
    cy.contains('button', 'rename').should('be.enabled').click()
  })
}

const navigateToRegistrationSteps = () => {
  cy.xpath('//*[@id="app"]/div/div/div[2]/div/div/div[1]').click()
  cy.xpath('//*[@id="app"]/div/div/div[2]/div/div/div[2]').click()
  cy.xpath('//*[@id="app"]/div/div/div[2]/div/div/div[3]').click()
  cy.xpath('//*[@id="app"]/div/div/div[2]/div/div/div[4]').click()
  cy.xpath('//*[@id="app"]/div/div/div[2]/div/div/div[5]').click()
}

describe('new user registration', () => {
  beforeEach(() => {
    cy.visit('/register')
  })

  it('invalid account details', () => {
    accountData.forEach(data => {
      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[1]')
        .contains('Account information')
        .should('be.visible')

      // filling account information

      cy.get('button[type=submit]').should('be.disabled')
      fillAccountDetails(data)
      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[2]/div[1]/div[1]/div[2]/div[2]/div')
        .contains('Invalid e-mail')
        .should('be.visible')

      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[2]/div[1]/div[1]/div[4]/div[2]/div')
        .contains('Invalid phone number format')
        .should('be.visible')

      cy.get('button[type=submit]').should('be.disabled')
    })
  })

  //   validating Add and invite buttons with address and invite email as null

  it('validateOptionalFieldsWithNull', () => {
    optionalDetailsWithNull.forEach(data => {
      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[1]')
        .contains('Account information')
        .should('be.visible')
      cy.get('button[type=submit]').as('next').should('be.disabled')
      fillAccountDetails(data)
      cy.get('@next').click()

      cy.get('@next').should('be.enabled')

      data.workDetails?.forEach(val => {
        cy.getInputByLabel('Location label').type(val.addressLabel)

        if (data.commodity) {
          cy.getInputByLabel('Commodities that you export').type(val.commodity)
        }
        cy.contains('button', 'Add').should('be.disabled')
      })
      cy.getInputByLabel('Location label').clear()

      data.workDetails?.forEach(val => {
        cy.getInputByLabel('Address').type(val.address).type('{downarrow}')
        if (data.commodity) {
          cy.getInputByLabel('Commodities that you export').type(val.commodity)
        }
        cy.contains('button', 'Add').should('be.disabled')

        cy.getInputByLabel('Address').clear()
      })
      cy.getInputByLabel('Address').clear()
      data.workDetails?.forEach(val => {
        fillWorkdetails(val)
      })

      cy.get('.mdi-close').first().click()
      cy.get('.v-dialog').contains('button', 'Remove').should('be.visible').click()

      cy.get('@next').click()
      data.inviteTeam?.forEach(val => {
        cy.getInputByLabel('Worker ID').type(val.workerId)
        cy.contains('button', ' add member ').should('be.disabled')
        cy.getInputByLabel('Worker ID').clear()
      })
      data.inviteTeam?.forEach(val => {
        cy.getInputByLabel('Email').type(val.email)
        cy.contains('button', ' add member ').should('be.disabled')
        cy.getInputByLabel('Email').clear()
      })
      cy.getInputByLabel('Email').clear()
      data.inviteTeam?.forEach(val => {
        fillInviteTeam(val)
        cy.getInputByLabel('Email').clear()
        cy.getInputByLabel('Worker ID').clear()
      })

      cy.get('.mdi-close').first().click()
      cy.get('.v-dialog').contains('button', 'Remove').should('be.visible').click()

      cy.get('@next').click()
    })
  })

  it('valid registration', () => {
    validData.forEach(data => {
      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[1]')
        .contains('Account information')
        .should('be.visible')

      // filling account information
      cy.get('button[type=submit]').should('be.disabled')
      fillAccountDetails(data)

      cy.get('button[type=submit]').as('next').should('be.enabled')

      cy.get('@next').click()

      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[1]')
        .contains('Work details')
        .should('be.visible')
      cy.get('@next').should('be.enabled')

      // filling work details
      data.workDetails?.forEach(val => {
        fillWorkdetails(val)
      })

      cy.get('@next').click()

      cy.get('@next').should('be.enabled')

      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[1]')
        .contains('Invite team members')
        .should('be.visible')

      // filling invite team members
      data.inviteTeam?.forEach(val => {
        fillInviteTeam(val)
      })

      cy.get('@next').click()

      cy.get('@next').should('be.enabled')

      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[1]')
        .contains('Trucker requirements')
        .should('be.visible')

      // filling Trucker requirements
      fillTruckerRequirments(data)

      cy.get('@next').click()
      cy.contains('button', 'Create workspace').should('be.enabled')

      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[1]')
        .contains('Required onboarding documents')
        .should('be.visible')

      // Fill onboard documents

      onBoardDocuments(data)
      navigateToRegistrationSteps()
      cy.contains('button', 'Create workspace').click()
      cy.wait(9000)
      cy.get('.v-alert').contains('Verification email sent!').should('be.visible')
      cy.url().should('include', '/verify1')
      cy.searchDocData('pending_verifications', 'email', data.email).then(docs => {
        expect(docs.length).to.be.at.least(1)
      })
    })
  })

  it('user registration with existing email', () => {
    validData.forEach(data => {
      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[1]')
        .contains('Account information')
        .should('be.visible')

      // filling account information
      cy.get('button[type=submit]').should('be.disabled')
      fillAccountDetails(data)

      cy.get('button[type=submit]').as('next').should('be.enabled')

      cy.get('@next').click()

      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[1]')
        .contains('Work details')
        .should('be.visible')
      cy.get('@next').should('be.enabled')

      // filling work details
      data.workDetails?.forEach(val => {
        fillWorkdetails(val)
      })

      cy.get('@next').click()

      cy.get('@next').should('be.enabled')

      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[1]')
        .contains('Invite team members')
        .should('be.visible')

      // filling invite team members
      data.inviteTeam?.forEach(val => {
        fillInviteTeam(val)
      })

      cy.get('@next').click()

      cy.get('@next').should('be.enabled')

      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[1]')
        .contains('Trucker requirements')
        .should('be.visible')

      // filling Trucker requirements
      fillTruckerRequirments(data)

      cy.get('@next').click()
      cy.contains('button', 'Create workspace').should('be.enabled')

      cy.xpath('//*[@id="app"]/div/div/div[2]/form/div[1]')
        .contains('Required onboarding documents')
        .should('be.visible')

      // Fill onboard documents

      onBoardDocuments(data)
      cy.contains('button', 'Create workspace').click()
      cy.get('.v-alert').contains('Email already in use').should('be.visible')
    })
  })
})
