export function fillBookingRef(ref) {
  cy.getInputByLabel('Booking ref*').type(ref)
}
export function fillNoOfContainers(containers) {
  cy.getInputByLabel('Number of containers*').type(containers)
}
export function fillBookingSSL(ssl) {
  cy.getInputByLabel('SSL *').type('{enter}', { force: true })
  cy.get('.v-overlay__content > .v-list > .v-list-item > .v-list-item__content')
    .contains(ssl)
    .click()
}
export function fillBookingExpiry(expiry) {
  cy.get('.styleDatePicker[label="Booking expiry *"]').click().as('datePicker')

  // cy.get('.v3dp__heading > .v3dp__heading__button :visible').last().click()
  cy.get('@datePicker')
    .get('.v3dp__elements')
    .find('button')
    .filter(':visible')
    .find(`:contains(${expiry.date})`)

    // .should('be.visible')
    .click({ force: true })
}
export function fillBookingExpiration(expiry) {
  cy.get('.styleDatePicker[label="Booking Expiration *"]').click().as('datePicker')

  // cy.get('.v3dp__heading > .v3dp__heading__button :visible').last().click()
  cy.get('@datePicker')
    .get('.v3dp__elements')
    .find('button')
    .filter(':visible')
    .find(`:contains(${expiry.date})`)

    // .should('be.visible')
    .click({ force: true })
}
export function fillPreferedCarrier(pcw) {
  cy.get('.styleDatePicker[label="Preferred carrier window"]').click().as('datePicker')

  // cy.get('.v3dp__heading > .v3dp__heading__button :visible').last().click()

  cy.get('@datePicker')
    .get('.v3dp__elements')
    .find('button')
    .filter(':visible')
    .find(`:contains(${pcw.date})`)

    // .should('be.visible')
    .click({ force: true })
}

export function fillBookingYard(yard) {
  cy.getInputByLabel('Yard label *').type('{enter}', { force: true })
  cy.get('.v-list-item-title').contains(yard).click()
}

export function fillBookingEquipment(size) {
  cy.getInputByLabel('Equipment type*').click({ force: true })

  cy.get('.v-overlay__content > .v-list > .v-list-item > .v-list-item__content')
    .contains(size)
    .click()
}

export function fillTruckerScac(truckerScac) {
  if (truckerScac) {
    cy.get('input[placeholder="Choose truckers by SCAС *"]').type(truckerScac)
    cy.get('.v-overlay__content > .v-list > .v-list-item > .v-list-item__content')
      .contains(truckerScac)
      .click()

    // cy.get('.chipLabel').contains(data.TruckersScac).should('be.visible')
  }
}

export function clearFieldData(field) {
  cy.getInputByLabel(field).clear()
}
