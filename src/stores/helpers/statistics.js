import { countBy, filter, flatMap, get, groupBy, map, meanBy, sum } from 'lodash'
import moment from 'moment'

const calculateMonthlyAverage = (bookings, filterType) => {
  const filteredBookings = filter(
    bookings,
    ({ status }) => filterType === 'all' || (filterType === 'completed' && status === 'completed'),
  )
  const countsByMonth = countBy(filteredBookings, ({ created }) => moment(created).month())

  return map(countsByMonth, (count, month) => ({
    month: moment().month(month).format('MMM'),
    average: count,
    change: calculateMonthlyChange(countsByMonth, month),
  }))
}

const calculateMonthlyChange = (countsByMonth, month) => {
  const prevMonth = get(countsByMonth, parseInt(month) - 1, 0)

  return prevMonth
    ? (((countsByMonth[month] - prevMonth) / prevMonth) * 100).toFixed(2) + '%'
    : 'N/A'
}

const calculateAverageTimes = commitments => {
  const approvedTimes = flatMap(commitments, ({ timeLine, created }) =>
    map(filter(timeLine, { status: 'approved' }), ({ time_stamp }) =>
      moment(time_stamp).diff(moment(created), 'hours', true),
    ),
  )

  return meanBy(approvedTimes) || 0
}

const getMonthsArray = () => map(Array(12), (_, i) => moment().month(i).format('MMM'))

const groupBookingsByMonth = bookings => {
  const countsByMonth = countBy(bookings, ({ created }) => moment(created).month())

  return map(Array(12).fill(0), (_, i) => get(countsByMonth, i, 0))
}

const groupBySSL = bookings =>
  map(groupBy(bookings, 'line.label'), (group, line) => ({
    line,
    jointBookings: group.length,
    averageFulfillmentTime: meanBy(group, ({ created, updated }) =>
      moment(updated).diff(moment(created), 'hours', true),
    ).toFixed(2),
  }))

const calculateTruckerStats = (bookings, commitments) => {
  const truckerInfo = flatMap(bookings, ({ carriers, createdAt, updatedAt, status, ref }) => {
    return map(carriers, carrier => ({ ...carrier, createdAt, updatedAt, status, ref }))
  })
  const groupedByScac = groupBy(truckerInfo, 'scac')

  return map(groupedByScac, (carriers, scac) => {
    return {
      id: scac,
      scac,
      email: get(carriers, '[0].email', ''),
      company: get(carriers, '[0].company', ''),
      committedBookings: sum(map(carriers, 'approved')),
      committedFulfilled: sum(map(carriers, 'onboarded')),
      performance: {
        averageFulfillmentTime: meanBy(carriers, ({ created, updated }) =>
          moment(updated).diff(moment(created), 'hours', true),
        ).toFixed(2),
        cancellationRate: `${(
          (filter(bookings, { status: 'canceled' }).length / bookings.length) *
          100
        ).toFixed(2)}%`,
        averageAcceptanceTime: calculateAverageTimes(
          filter(commitments, ({ scac: commitmentScac }) => commitmentScac === scac),
        ),
      },
    }
  })
}

const groupBookingsByYard = (bookings, locations) =>
  map(locations, ({ id, address }) => ({
    id,
    location: { id, address },
    entities: filter(bookings, ({ location }) => location.address === address),
  }))

export {
  calculateMonthlyAverage,
  getMonthsArray,
  groupBookingsByMonth,
  groupBySSL,
  calculateTruckerStats,
  groupBookingsByYard,
}
