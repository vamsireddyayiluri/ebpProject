import { validData } from '../fixtures/bookings/validData'
import { validData as register } from '../fixtures/register'
import { editRowData, editBookingData, filterData } from '../fixtures/bookings/editData'
import {
  clearFieldData,
  fillAverageWeight,
  fillBookingEquipment,
  fillBookingExpiration,
  fillBookingExpiry,
  fillBookingRef,
  fillBookingSSL,
  fillBookingYard,
  fillNoOfContainers,
  fillPreferedCarrier,
  fillTargetRate,
  fillTruckerScac,
  fillcommodity,
  selectTargetRateType,
} from '../helpers/bookings'

describe('Creating new Bookings', () => {
  before(() => {
    cy.visit('/login')
    cy.wait(4000)
    cy.url().then(url => {
      if (!url.includes('/dashboard')) {
        // If the URL doesn't contain '/dashboard', navigate to the dashboard route
        cy.visit('/login')

        // cy.userLogin(register[0].email, register[0].password)

        cy.userLogin('sravanthi.gorantla@cognine.com', '123456789')
      }
    })
  })

  it('Create booking with valid data', () => {
    cy.get('button[type="button"]').contains('Booking').click()
    cy.contains('button', 'Create booking').should('be.visible').click()
    cy.get('.v-dialog').should('be.visible')

    validData.forEach(data => {
      cy.contains('Create booking')
      cy.get('button[type="submit"]').should('be.disabled').as('submitbutton').contains('Create')

      fillBookingRef(data.ref)
      fillNoOfContainers(data.noOfContainers)
      fillBookingSSL(data.ssl)
      fillBookingExpiration(data.expiry)
      fillBookingYard(data.yard)
      fillcommodity(data.commodity)
      fillAverageWeight(data.averageWeight)
      fillTargetRate(data.targetRate)
      selectTargetRateType(data.targetRateType)
      fillBookingEquipment(data.equipmentType)
      fillTruckerScac(data.TruckersScac)
      cy.getInputByLabel('Loading date *')
        .invoke('val')
        .then(sometext => {
          cy.wrap(sometext).as('expiry')
        })

      cy.get('@submitbutton').should('be.enabled').click()
      cy.wait(2000)

      // cy.get('.v-alert').contains(`Booking ${data.ref} has been created`)
      cy.get('@expiry').then(sometext => {
        cy.searchDataWithTwoLables('bookings', 'ref', data.ref, 'bookingExpiry', sometext).then(
          docs => {
            expect(docs.length).to.be.at.least(1)
          },
        )
      })

      // cy.get('.v-col[data-column="ref"]').last().contains(data.ref)
    })
  })

  it('edit booking with valid data', () => {
    cy.wait(1000)
    cy.get('#bookingsTable')
      .get(`.v-col[data-column="ref"]`)
      .find(`:contains(${editRowData.ref})`)
      .parent()
      .parent()
      .find(`.v-col[data-column="expiry"] :contains(${editRowData.expiry})`)
      .parent()
      .parent()
      .as('selectedRow')

    cy.get('@selectedRow')
      .find('button')
      .as('actionbutton')
      .then(element => {
        if (element.length) {
          cy.log(element)
          cy.get('@actionbutton').find('.mdi-dots-vertical').click()
        } else {
          cy.get('@selectedRow').scrollTo('right').find('[class=mdi-dots-vertical]').click()
        }
      })
    cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Edit booking').click()
    cy.wait(1000)
    if (editBookingData.expiry) {
      fillBookingExpiry(editBookingData.expiry)
    }
    if (editBookingData?.ssl) {
      fillBookingSSL(editBookingData.ssl)
    }
    if (editBookingData.equipmentType) {
      fillBookingEquipment(editBookingData.equipmentType)
    }

    cy.get('button[type="submit"]').contains('Save').click()
    cy.get('.v-dialog').get('button[type="button"]').contains('Save').click()
    cy.get('.v-alert').contains('Bookings updated')

    // cy.get('@selectedRow').find('.v-col[data-column="ssl"]').find(`img[alt=${editBookingData.ssl}]`)
  })

  it('Reactive booking from booking history', () => {
    cy.wait(2000)
    cy.get('button[type="button"]').contains('Booking history').click()

    cy.get('#bookingsHistoryTable')
      .get(`.v-col[data-column="ref"]`)
      .find(`:contains(${editRowData.ref})`)
      .parent()
      .parent()
      .find(`.v-col[data-column="expiry"] :contains(${editRowData.currentDate})`)
      .parent()
      .parent()
      .click()
      .as('selectedRow')

    // cy.get('@selectedRow')
    //   .find('button')
    //   .as('actionbutton')
    //   .then(element => {
    //     if (element.length) {
    //       cy.log(element)
    //       cy.get('@actionbutton').click()
    //     } else {
    //       cy.get('@selectedRow').scrollTo('right').find('[class=mdi-dots-vertical]').click()
    //     }
    //   })

    // cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Re-activate').click()

    cy.getInputByLabel('Re-activate booking').click()

    fillBookingExpiry(validData[0].expiry)

    cy.get('button[type="submit"]').should('be.enabled').contains('Save').click()

    cy.get('.v-dialog').get('button[type="button"]').contains('Save').click()
    cy.get('.v-alert').contains('Reactivated booking')

    cy.searchDataWithTwoLables(
      'bookings',
      'ref',
      editRowData.ref,
      'bookingExpiry',
      validData[0].expiry,
    ).then(docs => {
      expect(docs.length).to.be.at.least(1)
    })
  })

  it('Remove Booking from the network', () => {
    cy.get('button[type="button"]').contains('Booking').click()
    cy.get('#bookingsTable')
      .get(`.v-col[data-column="ref"]`)
      .find(` :contains(${editRowData.ref})`)
      .parent()
      .parent()
      .find(`.v-col[data-column="expiry"] :contains(${editRowData.expiry})`)
      .parent()
      .parent()
      .as('selectedRow')

    cy.get('@selectedRow')
      .find('button')
      .as('actionbutton')
      .then(element => {
        if (element.length) {
          cy.log(element)
          cy.get('@actionbutton').find('.mdi-dots-vertical').click()
        } else {
          cy.get('@selectedRow').scrollTo('right').find('[class=mdi-dots-vertical]').click()
        }
      })
    cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Edit booking').click()
    cy.wait(1000)
    cy.contains('Remove from network').should('be.visible').click()

    cy.get('.v-alert').contains('Bookings removed!').should('be.visible')
    cy.wait(1000)
    cy.searchDataWithTwoLables(
      'drafts',
      'ref',
      editRowData.ref,
      'bookingExpiry',
      editRowData.expiry,
    ).then(docs => {
      console.log('docs,', docs)
      expect(docs.length).to.be.at.least(1)
    })
  })

  it('Publish Booking from drafts to bookings', () => {
    cy.get('button[type="button"]').contains('Drafts').click()
    cy.get('button[type="button"]').contains('Map').click({ force: true })
    cy.get('#draftTable')
      .get(`.v-col[data-column="ref"]`)
      .find(`:contains(${editRowData.ref})`)
      .parent()
      .parent()
      .find(`.v-col[data-column="expiry"] :contains(${editRowData.expiry})`)
      .parent()
      .parent()
      .as('selectedRow')

    cy.get('@selectedRow')
      .find('button')
      .as('actionbutton')
      .then(element => {
        if (element.length) {
          cy.log(element)
          cy.get('@actionbutton').find('.mdi-dots-vertical').click()
        } else {
          cy.get('@selectedRow').scrollTo('right').find('[class=mdi-dots-vertical]').click()
        }
      })
    cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Edit').click()
    cy.wait(1000)

    cy.get('button[type="button"]').contains('publish').should('be.visible').click()

    cy.get('.v-alert').contains('Draft was deleted').should('be.visible')
    cy.wait(1000)
    cy.searchDataWithTwoLables(
      'bookings',
      'ref',
      editRowData.ref,
      'bookingExpiry',
      editRowData.expiry,
    ).then(docs => {
      expect(docs.length).to.be.at.least(1)
    })
  })

  it('Remove booking', () => {
    cy.get('button[type="button"]').contains('Booking').click()
    cy.get('button[type="button"]').contains('Map').click({ force: true })
    cy.get('#bookingsTable')
      .get(`.v-col[data-column="ref"]`)
      .find(` :contains(${editRowData.ref})`)
      .parent()
      .parent()
      .find(`.v-col[data-column="expiry"] :contains(${editRowData.expiry})`)
      .parent()
      .parent()
      .as('selectedRow')

    cy.get('@selectedRow')
      .find('button')
      .as('actionbutton')
      .then(element => {
        if (element.length) {
          cy.log(element)
          cy.get('@actionbutton').find('.mdi-dots-vertical').click()
        } else {
          cy.get('@selectedRow').scrollTo('right').find('[class=mdi-dots-vertical]').click()
        }
      })
    cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Remove booking').click()

    cy.get('.v-dialog').should('be.visible')

    cy.get('button[type="button"]').contains('Remove').click()

    cy.get('.v-alert').contains('Bookings removed!')

    cy.searchDataWithTwoLables(
      'bookings',
      'ref',
      editRowData.ref,
      'bookingExpiry',
      editRowData.expiry,
    ).then(docs => {
      expect(docs.length).to.be.at.least(0)
    })
    cy.searchDataWithTwoLables(
      'drafts',
      'ref',
      editRowData.ref,
      'bookingExpiry',
      editRowData.expiry,
    ).then(docs => {
      expect(docs.length).to.be.at.least(1)
    })
    cy.get('button[type="button"]').contains('Drafts').click()
    cy.get('#draftTable')
      .get(`.v-col[data-column="ref"]`)
      .find(`:contains(${editRowData.ref})`)
      .parent()
      .parent()
      .find(`.v-col[data-column="expiry"] :contains(${editRowData.expiry})`)
      .parent()
      .parent()
      .as('selectedRow')

    cy.get('@selectedRow')
      .find('button')
      .as('actionbutton')
      .then(element => {
        if (element.length) {
          cy.log(element)
          cy.get('@actionbutton').find('.mdi-dots-vertical').click()
        } else {
          cy.get('@selectedRow').scrollTo('right').find('[class=mdi-dots-vertical]').click()
        }
      })
    cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Delete').click()

    cy.get('.v-dialog').should('be.visible')

    cy.get('button[type="button"]').contains('Delete').click()

    cy.get('.v-alert').contains('Draft was deleted').should('be.visible')

    cy.searchDataWithTwoLables(
      'drafts',
      'ref',
      editRowData.ref,
      'bookingExpiry',
      editRowData.expiry,
    ).then(docs => {
      expect(docs.length).to.be.at.least(0)
    })
  })

  it('add Validations to the filters', () => {
    cy.get('button[type="button"]').contains('Booking').click()
    cy.get('input[placeholder="Search..."]').type(filterData.search)
    cy.wait(1000)
    cy.get('#bookingsTable')
      .find('.vue-recycle-scroller__item-wrapper ')
      .as('tableBody')
      .then(ele => {
        if (ele.length && ele.is(':visible')) {
          cy.get('@tableBody').contains(filterData.search)
        } else {
          cy.get('#bookingsTable').contains(' No results ').should('be.visible')
        }
      })

    cy.get('.v-field__clearable').should('be.visible').first().click()

    cy.getInputByLabel('SSL').click({ force: true })
    cy.get('.v-overlay__content > .v-list > .v-list-item > .v-list-item__content')
      .contains(filterData.ssl)
      .click()
    cy.wait(1000)
    cy.get('#bookingsTable')
      .find('.vue-recycle-scroller__item-wrapper ')

      .as('tableBody')
      .then(ele => {
        if (ele.length && ele.is(':visible')) {
          cy.get('@tableBody').find('.v-col[data-column="ssl"]').find(`img[alt=${filterData.ssl}]`)
        } else {
          cy.get('#bookingsTable').contains(' No results ').should('be.visible')
        }
      })
  })

  it('validate create booking', () => {
    cy.contains('button', 'Create booking').should('be.visible').click()
    cy.get('.v-dialog').should('be.visible')
    validData.forEach(data => {
      cy.contains('Create booking')
      cy.get('button[type="submit"]').should('be.disabled').as('submitbutton').contains('Create')

      fillBookingRef(data.ref)
      cy.get('@submitbutton').should('be.disabled')
      fillNoOfContainers(data.noOfContainers)
      cy.get('@submitbutton').should('be.disabled')
      fillBookingSSL(data.ssl)
      cy.get('@submitbutton').should('be.disabled')
      fillBookingExpiration(data.expiry)
      cy.get('@submitbutton').should('be.disabled')
      fillPreferedCarrier(data.pcw)
      cy.get('@submitbutton').should('be.disabled')
      fillBookingYard(data.yard)
      cy.get('@submitbutton').should('be.disabled')
      fillcommodity(data.commodity)
      cy.get('@submitbutton').should('be.disabled')
      fillAverageWeight(data.averageWeight)
      cy.get('@submitbutton').should('be.disabled')
      fillTargetRate(data.targetRate)
      cy.get('@submitbutton').should('be.disabled')
      fillBookingEquipment(data.equipmentType)
      cy.get('@submitbutton').should('be.enabled')

      clearFieldData('Booking ref*')
      cy.get('@submitbutton').should('be.disabled')
      fillBookingRef(data.ref)
      cy.get('@submitbutton').should('be.enabled')
      clearFieldData('Number of containers*')
      cy.get('@submitbutton').should('be.disabled')
      fillNoOfContainers(data.noOfContainers)
      clearFieldData('Target rate*')
      cy.get('@submitbutton').should('be.disabled')
      fillTargetRate(data.targetRate)
      cy.get('@submitbutton').should('be.enabled')

      cy.xpath('/html/body/div[2]/div/div[2]/div/div[2]/div/div[2]/div/button').click({
        force: true,
      })
      cy.get('.v-dialog').should('have.length', 2)
      cy.contains('Do you want to keep the bookings in Drafts?')
      cy.get('button[type="button"]').contains('cancel').click()
    })
  })

  it('Create booking and move to drafts', () => {
    cy.get('button[type="button"]').contains('Drafts').click()
    cy.contains('button', 'Create booking').should('be.visible').click()
    cy.get('.v-dialog').should('be.visible')
    validData.forEach(data => {
      cy.contains('Create booking')
      cy.get('button[type="submit"]').should('be.disabled').as('submitbutton').contains('Create')

      fillBookingRef(data.ref)
      fillNoOfContainers(data.noOfContainers)
      fillBookingSSL(data.ssl)
      fillBookingExpiration(data.expiry)
      fillPreferedCarrier(data.pcw)
      fillBookingYard(data.yard)
      fillBookingEquipment(data.equipmentType)
      fillcommodity(data.commodity)
      fillAverageWeight(data.averageWeight)
      fillTargetRate(data.targetRate)
      selectTargetRateType(data.targetRateType)

      // fillTruckerScac(data.TruckersScac)

      cy.getInputByLabel('Loading date *')
        .invoke('val')
        .then(sometext => {
          cy.wrap(sometext).as('expiry')
        })

      // cy.get('.v-overlay--active').click('left')
      // cy.xpath('/html/body/div[2]/div[5]/div[2]/div/div[2]/div/div[2]/div/button').click({
      //   force: true,
      // })
      cy.get('.mdi-close').first().click({ force: true })
      cy.get('.v-dialog').should('have.length', 2)
      cy.contains('Do you want to keep the bookings in Drafts?')
      cy.get('button[type="button"]').contains('save').click()

      cy.get('@expiry').then(sometext => {
        cy.searchDataWithTwoLables('drafts', 'ref', data.ref, 'bookingExpiry', sometext).then(
          docs => {
            expect(docs.length).to.be.at.least(1)
          },
        )
      })
    })
  })

  it('Delete booking draft', () => {
    cy.get('button[type="button"]').contains('Drafts').click()

    cy.get('#draftTable')
      .get(`.v-col[data-column="ref"]`)
      .find(`:contains(${editRowData.ref})`)
      .parent()
      .parent()
      .find(`.v-col[data-column="expiry"] :contains(${editRowData.expiry})`)
      .parent()
      .parent()
      .as('selectedRow')

    cy.get('@selectedRow')
      .find('button')
      .as('actionbutton')
      .then(element => {
        if (element.length) {
          cy.log(element)
          cy.get('@actionbutton').find('.mdi-dots-vertical').click()
        } else {
          cy.get('@selectedRow').scrollTo('right').find('[class=mdi-dots-vertical]').click()
        }
      })
    cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Delete').click()

    cy.get('.v-dialog').should('be.visible')

    cy.get('button[type="button"]').contains('Delete').click()

    cy.get('.v-alert').contains('Draft was deleted').should('be.visible')

    cy.searchDataWithTwoLables(
      'drafts',
      'ref',
      editRowData.ref,
      'bookingExpiry',
      editRowData.expiry,
    ).then(docs => {
      expect(docs.length).to.be.at.least(0)
    })
  })
})
