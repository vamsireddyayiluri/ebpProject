import { map, filter, countBy, groupBy, flatMap, reduce, fill, get } from 'lodash'
import moment from 'moment'

const calculateMonthlyAverage = (bookings, filterType) => {
  const filteredBookings = filter(
    bookings,
    ({ status, created }) =>
      filterType === 'all' || (filterType === 'completed' && status === 'completed'),
  )
  const countsByMonth = countBy(filteredBookings, ({ created }) => moment(created).month())
  const months = Object.keys(countsByMonth).sort((a, b) => a - b)
  const averages = reduce(
    months,
    (result, month, index) => {
      const count = countsByMonth[month]
      const prevCount = get(countsByMonth, months[index - 1], 0)
      const change = index > 0 ? (((count - prevCount) / prevCount) * 100).toFixed(2) + '%' : 'N/A'

      return [
        ...result,
        {
          month: moment().month(month).format('MMM'),
          average: count,
          change,
        },
      ]
    },
    [],
  )

  return averages
}

const calculateAverageTimes = commitments => {
  const approvedTimes = flatMap(commitments, ({ timeLine, created }) => {
    const approvedTime = filter(timeLine, { status: 'approved' }).map(
      ({ time_stamp }) => time_stamp,
    )

    return approvedTime.map(timeStamp => moment(timeStamp).diff(moment(created), 'hours', true))
  })

  return approvedTimes.length > 0
    ? reduce(approvedTimes, (sum, n) => sum + n, 0) / approvedTimes.length
    : 0
}

const getMonthsArray = () => map(fill(Array(12), 0), (_, i) => moment().month(i).format('MMM'))

const groupBookingsByMonth = bookings => {
  const countsByMonth = countBy(bookings, ({ created }) => moment(created).month())

  return map(fill(Array(12), 0), (_, i) => get(countsByMonth, i, 0))
}

const groupBySSL = bookings =>
  map(groupBy(bookings, 'line.label'), (group, line) => ({
    line,
    jointBookings: group.length,
  }))

const calculateTruckerStats = (bookings, commitments) => {
  const truckerInfo = flatMap(bookings, ({ carriers, id: bookingId, created, updated, status }) =>
    map(carriers, carrier => ({ ...carrier, bookingId, created, updated, status })),
  )
  const groupedByScac = groupBy(truckerInfo, 'scac')

  const canceledCount = filter(bookings, { status: 'canceled' }).length
  const cancellationRate = ((canceledCount / bookings.length) * 100).toFixed(2) + '%'

  return map(groupedByScac, ([carriers], scac) => {
    const relevantCommitments = filter(
      commitments,
      ({ scac: commitmentScac }) => commitmentScac === scac,
    )
    const averageAcceptanceTime = calculateAverageTimes(relevantCommitments)
    const { company, created, email, updated } = carriers
    const averageFulfillmentTime = moment(updated).diff(moment(created), 'hours', true)

    return {
      id: scac,
      scac,
      email,
      company,
      committedBookings: carriers.length,
      committedFulfilled: map(carriers, 'approved'),
      performance: {
        averageFulfillmentTime,
        cancellationRate,
        averageAcceptanceTime,
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
