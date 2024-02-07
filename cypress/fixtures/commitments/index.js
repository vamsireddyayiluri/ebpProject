import moment from 'moment-timezone'

export const commitmentData = {
  bookingRef: 'ref01',
  expiry: moment().endOf('day').format('MM/D/YYYY hh:mm:ss a'),
  expiryDate: moment().format('MM/DD/YYYY'),
  committedCount: 1,
}

export const truckerCompany1 = {
  truckerCompany: 'Test Company',
  truckerEmail: 'test.compnay@gmail.com',
  truckerId: '1234555',
  truckerScac: 'WXYZ',
  truckerOrgId: '987456230',
}

export const truckerCompany2 = {
  truckerCompany: 'Test Company',
  truckerEmail: 'test.compnay@gmail.com',
  truckerId: '1234555',
  truckerScac: 'ABCD',
  truckerOrgId: '987456230',
}

export const reasonCode = {
  incompleteReason: 'Not working',
  declineReason: 'Booking rolled',
}
