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

const groupBySSL = bookings => {
  return map(groupBy(bookings, 'line.label'), (group, line) => ({
    line: group[0].line,
    jointBookings: group.length,
    averageFulfillmentTime: meanBy(group, ({ createdAt, updated }) =>
      moment(updated).diff(moment(createdAt), 'hours', true),
    ).toFixed(2),
    completed: filter(group, { status: 'completed' }).length,
  }))
}

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
