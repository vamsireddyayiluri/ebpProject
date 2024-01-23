describe('notifications', () => {
  before(() => {
    cy.url().then(url => {
      cy.visit('/settings')
      cy.wait(3000)
      cy.url().then(url => {
        if (!url.includes('/settings')) {
          cy.visit('/login')
          cy.userLogin('sravanthi.gorantla@cognine.com', '123456789')
        }
      })
    })
  })
  it('check notifications are enabled after registration', () => {
    console.log('notifications')
    cy.get('button[type="button"]').should('be.visible').contains('Notifications').click()
    cy.getInputByLabel('News and updates').should('be.checked')
    cy.get('.notificationTab').find('.mdi-chevron-down').first().click()
    cy.getInputByLabel('Get notifications both on the platform and by email').should('be.checked')

    cy.getInputByLabel('Information about bookings').should('be.checked')
    cy.get('.notificationTab').find('.mdi-chevron-down').last().click()
    cy.getInputByLabel('Get notifications both on the platform and by email').should('be.checked')

    cy.get('button[type="submit"]').should('be.disabled').contains('Save')
    cy.get('button[type="button"]').should('be.disabled').contains('Cancel changes')
  })
  it('Cancel edit changes', () => {
    console.log('notifications')
    cy.getInputByLabel('Get notifications on the platform').check()
    cy.get('button[type="button"]').should('be.enabled').contains('Cancel changes').click()
  })
  it('Edit notification data', () => {
    cy.getInputByLabel('Get notifications on the platform').check()
    cy.get('button[type="submit"]').should('be.enabled').contains('Save').click()
    cy.get('.v-alert').contains(` `)
  })
})
