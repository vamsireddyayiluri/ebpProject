import moment from 'moment-timezone'

export const rulesData = {
  address: '1200',
  addressLabel: 'test',
  commodity: 'food',
  preferredCarrierDefault: 4,
  notificationCutoffDays: 3,
  truckerScac: 'PORF',
  expiryDate: moment().add(1, 'days').format('DD'),
  prefrredDate: moment().format('MM/DD/YYYY'),
}
