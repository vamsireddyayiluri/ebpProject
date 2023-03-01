import moment from 'moment-timezone'

export default () => [
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
    text: 'Size/Type',
    value: 'size',
    align: 'start',
    sortable: true,
  },
  {
    text: 'Requested',
    value: 'created',
    sortable: true,
    sorter: (a, b) => moment(a).diff(moment(b)),
  },
]
