import moment from 'moment-timezone'

export const validData = [
  {
    ref: 'ref01',
    noOfContainers: 2,
    ssl: 'APL',
    expiry: { date: moment().format('DD') },
    pcw: { date: moment().format('DD') },
    yard: 'test1',
    equipmentType: { flexibleBooking: false, size: '20 Foot Flat Rack' },
    TruckersScac: 'NUSB',
    commodity: 'test',
    averageWeight: '30000',
    targetRate: '500',
    targetRateType: 'All in rate',
    insurance: '500,000+',
  },
]
