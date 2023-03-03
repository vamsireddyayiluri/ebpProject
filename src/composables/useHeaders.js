import moment from 'moment-timezone'

export const turnsHeaders = [
  {
    text: 'Booking ref',
    value: 'ref',
    sortable: true,
  },
  {
    text: 'Container #',
    value: 'container',
    sortable: true,
  },
  {
    text: 'Size / Type',
    value: 'size',
    align: 'start',
    sortable: true,
    width: 2,
  },
  {
    text: 'Requested',
    value: 'created',
    sortable: true,
    sorter: (a, b) => moment(a).diff(moment(b)),
  },
  {
    text: 'Status',
    value: 'status',
    sortable: true,
    sorter: (a, b) => moment(a).diff(moment(b)),
  },
]

export const marketplaceHeaders = [
  {
    text: 'Container #',
    value: 'container',
    sortable: true,
  },
  {
    text: 'Size / Type',
    value: 'size',
    align: 'start',
    sortable: true,
    width: 2,
  },
  {
    text: 'Age of container',
    value: 'created',
    sortable: true,
    sorter: (a, b) => moment(a).diff(moment(b)),
  },
  {
    text: 'location',
    value: 'location',
    sortable: true,
    width: 3,
  },
  {
    text: 'Timestamp of exchange',
    value: 'created',
    sortable: true,
  },
]

export default () => ({
  turnsHeaders,
  marketplaceHeaders,
})
