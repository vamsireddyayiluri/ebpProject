import moment from 'moment-timezone'

export const editRowData = {
  ref: 'ref04',
  expiry: moment().add(1, 'days').startOf('day').format('MM/DD/YYYY hh:mm:ss a'),
  currentDate: moment().startOf('day').format('MM/DD/YYYY hh:mm:ss a'),
}

export const editBookingData = {
  // ssl: 'MCL',
  equipmentType: '45 Foot High Cube',
  expiry: { date: moment().format('DD') },
}

export const filterData = {
  search: 'test',
  ssl: 'ANL',
}
