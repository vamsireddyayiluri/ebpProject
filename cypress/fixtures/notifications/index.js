import moment from 'moment-timezone'
export const sendPlateformNotfication = {
  value: 'Get notifications on the platform',
}
export const bookingData = {
  ref: 'ref34',
  noOfContainers: 20,
  ssl: 'APL',
  expiry: { date: moment().format('DD') },
  pcw: { date: moment().format('DD') },
  yard: 'test1',
  equipmentType: '20 Foot Flat Rack',
  TruckersScac: 'NUSB',
  expiryDate: moment().startOf('day').format('MM/DD/YYYY hh:mm:ss a'),
}

export const bookingDatawithoutNotification = {
  ref: 'ref35',
  noOfContainers: 20,
  ssl: 'APL',
  expiry: { date: moment().format('DD') },
  pcw: { date: moment().format('DD') },
  yard: 'test1',
  equipmentType: '20 Foot Flat Rack',
  expiryDate: moment().startOf('day').format('MM/DD/YYYY hh:mm:ss a'),
}