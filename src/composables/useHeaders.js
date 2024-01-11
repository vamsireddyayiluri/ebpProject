import moment from 'moment-timezone'
import { userTypes } from '~/constants/userTypes'

export const bookingsHeaders = userType => {
  const headers = [
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
      text: 'Loading date',
      value: 'expiry',
      sortable: true,
      sorter: (a, b) => moment(a).diff(moment(b)),
    },
    {
      text: 'Progress',
      value: 'progress',
    },
  ]
  if (userType === userTypes.admin) {
    const workerColumn = {
      text: 'Worker',
      value: 'worker',
    }
    const secondToLastIndex = headers.length - 1
    headers.splice(secondToLastIndex, 0, workerColumn)
  }

  return headers
}
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
export const draftsHeaders = userType => {
  const headers = [
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
      text: 'Loading date',
      value: 'expiry',
      sortable: true,
      sorter: (a, b) => moment(a).diff(moment(b)),
    },
  ]
  if (userType === userTypes.admin) {
    const workerColumn = {
      text: 'Worker',
      value: 'worker',
    }
    const secondToLastIndex = headers.length - 1
    headers.splice(secondToLastIndex, 0, workerColumn)
  }

  return headers
}
export const truckersListHeaders = [
  {
    text: 'SCAC and email',
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
    text: 'Company',
    value: 'company',
    width: 2,
  },
  {
    text: 'Documents',
    value: 'documents',
  },
]
export const statisticsTruckersHeaders = [
  {
    text: 'Trucker',
    value: 'trucker',
    align: 'start',
    width: 3,
  },
  {
    text: 'Name of company',
    value: 'company',
    width: 3,
  },
  {
    text: 'Taken bookings',
    value: 'takenBookings',
  },
  {
    text: 'Taken/fulfilled',
    value: 'takenFulfilled',
  },
  {
    text: 'Performance',
    value: 'performance',
    width: 3,
  },
]
export const bookingsHistoryHeaders = [
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
    text: 'Loading date',
    value: 'expiry',
    sortable: true,
    sorter: (a, b) => moment(a).diff(moment(b)),
  },
  {
    text: 'Status',
    value: 'status',
  },
  {
    text: 'Truckers',
    value: 'truckers',
  },
]
export default () => ({
  bookingsHeaders,
  yardsHeaders,
  draftsHeaders,
  truckersListHeaders,
  truckersDocumentsHeaders,
  statisticsTruckersHeaders,
  bookingsHistoryHeaders,
})
