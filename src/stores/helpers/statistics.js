import { countBy, filter, flatMap, get, groupBy, map, meanBy, sum, sumBy } from 'lodash'
import moment from 'moment'

const calculateMonthlyAverage = (bookings, filterType) => {
  const filteredBookings = filter(
    bookings,
    ({ status }) => filterType === 'all' || (filterType === 'completed' && status === 'completed'),
  )
  const countsByMonth = countBy(filteredBookings, ({ createdAt }) => moment(createdAt).month())

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

const calculateAverageAcceptanceTimes = commitments => {
  const approvedTimes = flatMap(commitments, ({ timeLine, created, createdAt }) =>
    map(filter(timeLine, { status: 'approved' }), ({ time_stamp }) =>
      moment(time_stamp).diff(moment(created || createdAt), 'hours', true),
    ),
  )

  const mean = meanBy(approvedTimes)

  return isNaN(mean) ? 0 : mean.toFixed(2)
}

const calculateAverageFulfillmentTimes = bookings => {
  if (!bookings.every(booking => booking?.timeLine)) return 0

  const fulfilledTimes = flatMap(bookings, ({ timeLine, created, createdAt }) =>
    map(filter(timeLine, { message: 'Booking is 100% fulfilled' }), ({ time_stamp }) =>
      moment(time_stamp).diff(moment(created || createdAt), 'hours', true),
    ),
  )

  const mean = meanBy(fulfilledTimes)

  return isNaN(mean) ? 0 : mean.toFixed(2)
}

const getMonthsArray = () => map(Array(12), (_, i) => moment().month(i).format('MMM'))
const getDaysInMonth = (year, month) => {
  const daysInMonth = moment(`${year}-${month}`, "YYYY-MM").daysInMonth()
  let daysArray = []
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i)
  }

  return daysArray
}

const groupBookingsByMonth = (bookings, year) => {
  const countsByMonth = countBy(bookings, booking => {
    const bookingDate = moment(booking.createdAt)

    return bookingDate.year() === year ? bookingDate.month() : -1
  })

  return map(Array(12).fill(0), (_, i) => get(countsByMonth, i, 0))
}

const groupBookingsByDays = (bookings, year, month) => {
  const date = moment(`${year} ${month}`, "YYYY MMM")
  const startOfMonth = date.clone().startOf('month')
  const endOfMonth = date.clone().endOf('month')
  const filteredBookings = bookings.filter(booking =>
    moment(booking.createdAt).isBetween(startOfMonth, endOfMonth, undefined, '[]'),
  )
  const countsByDay = countBy(filteredBookings, ({ createdAt }) =>
    moment(createdAt).format('YYYY-MM-DD'),
  )
  const daysOfMonth = startOfMonth.daysInMonth()

  return map(Array.from({ length: daysOfMonth }), (item, index) => {
    const day = startOfMonth.clone().add(index, 'days').format('YYYY-MM-DD')

    return get(countsByDay, day, 0)
  })
}

const groupBySSL = bookings =>
  map(groupBy(bookings, 'line.label'), (group, line) => ({
    line: group[0].line,
    jointBookings: group.length,
    averageFulfillmentTime: calculateAverageFulfillmentTimes(group),
    completed: filter(group, { status: 'completed' }).length,
  }))

const calculateTruckerStats = (bookings, commitments) => {
  const truckerInfo = flatMap(
    bookings,
    ({ carriers, committed, createdAt, updatedAt, status, ref, timeLine = [] }) =>
      carriers?.map(carrier => ({
        ...carrier,
        committed,
        createdAt,
        updatedAt,
        status,
        ref,
        timeLine,
      })),
  )

  const groupedByScac = groupBy(truckerInfo, 'scac')

  return map(groupedByScac, (bookingsByScac, scac) => {
    const commitmentsByScac = filter(
      commitments,
      ({ scac: commitmentScac }) => commitmentScac === scac,
    )
    const onboardedCommitments = filter(commitmentsByScac, { status: 'onboarded' })

    return {
      id: scac,
      scac,
      committedBookings: bookingsByScac.length,
      committedFulfilled: [
        sumBy(bookingsByScac, 'committed'),
        sumBy(onboardedCommitments, 'committed'),
      ],
      performance: {
        averageFulfillmentTime: calculateAverageFulfillmentTimes(bookingsByScac),
        cancellationRate: `${(
          (filter(bookingsByScac, { status: 'canceled' }).length / bookingsByScac.length) *
          100
        ).toFixed(2)}%`,
        averageAcceptanceTime: calculateAverageAcceptanceTimes(commitmentsByScac),
      },
    }
  })
}

const groupBookingsByYard = (bookings, locations) =>
  map(locations, ({ id, value }) => ({
    id,
    location: { id, address: value },
    entities: filter(bookings, ({ location }) => location.address === value),
  }))

export {
  calculateMonthlyAverage,
  getMonthsArray,
  getDaysInMonth,
  groupBookingsByMonth,
  groupBookingsByDays,
  groupBySSL,
  calculateTruckerStats,
  groupBookingsByYard,
}
