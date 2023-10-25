import moment from "moment-timezone"

export const bookingsHeaders = [
  {
    text: 'Ref #',
    value: 'ref',
    align: 'start',
    width: 2,
  },
  {
    text: 'Yard label',
    value: 'yardLabel',
  },
  {
    text: 'SSL',
    value: 'ssl',
  },
  {
    text: 'Expiry',
    value: 'expiry',
    sortable: true,
    sorter: (a, b) => moment(a).diff(moment(b)),
  },
  {
    text: 'Progress',
    value: 'progress',
  },
]
export const yardsHeaders = [
  {
    text: 'Yard label',
    value: 'yardLabel',
    align: 'start',
    width: 3,
  },
  {
    text: 'Location',
    value: 'location',
  },
  {
    text: 'Progress',
    value: 'progress',
  },
]
export const draftsHeaders = [
  {
    text: 'Ref #',
    value: 'ref',
    align: 'start',
    width: 2,
  },
  {
    text: 'SSL',
    value: 'ssl',
  },
  {
    text: 'Yard label',
    value: 'yardLabel',
  },
  {
    text: 'Expiry',
    value: 'expiry',
    sortable: true,
    sorter: (a, b) => moment(a).diff(moment(b)),
  },
]
export const truckersListHeaders = [
  {
    text: 'SCAC ad email',
    value: 'scacEmail',
    align: 'start',
  },
  {
    text: 'Name of company',
    value: 'company',
  },
  {
    text: 'Last booking',
    value: 'lastBooking',
    sortable: true,
    sorter: (a, b) => moment(a).diff(moment(b)),
  },
]
export const truckersDocumentsHeaders = [
  {
    text: 'Trucker',
    value: 'trucker',
    align: 'start',
    width: 3,
  },
  {
    text: 'Documents',
    value: 'documents',
  },
]
export default () => ({
  bookingsHeaders,
  yardsHeaders,
  draftsHeaders,
  truckersListHeaders,
  truckersDocumentsHeaders,
})
