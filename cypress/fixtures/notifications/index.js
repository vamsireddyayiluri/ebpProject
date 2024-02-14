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
  equipmentType: { flexibleBooking: false, size: '20 Foot Flat Rack' },
  TruckersScac: 'NUSB',
  expiryDate: moment().startOf('day').format('MM/DD/YYYY hh:mm:ss a'),
  commodity: 'test',
  averageWeight: '30000',
  estimatedRate: '500',
  estimatedRateType: 'All in rate',
}

export const bookingDatawithoutNotification = {
  ref: 'ref35',
  noOfContainers: 20,
  ssl: 'APL',
  expiry: { date: moment().format('DD') },
  pcw: { date: moment().format('DD') },
  yard: 'test1',
  equipmentType: { flexibleBooking: false, size: '20 Foot Flat Rack' },
  expiryDate: moment().startOf('day').format('MM/DD/YYYY hh:mm:ss a'),
  commodity: 'test',
  averageWeight: '30000',
  estimatedRate: '500',
  estimatedRateType: 'All in rate',
}
