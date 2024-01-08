import moment from 'moment-timezone'

export const validData = [
  {
    ref: 'ref04',
    noOfContainers: 23,
    ssl: 'APL',
    expiry: { date: moment().add(1, 'days').format('DD') },
    pcw: { date: moment().format('DD') },
    yard: 'test1',
    equipmentType: '20 Foot Flat Rack',
    TruckersScac: 'NUSB',
  },
]
