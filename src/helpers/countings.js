import { statuses } from '~/constants/statuses'
import moment from 'moment-timezone'
import { useDate } from '~/composables'

const { getFormattedDate } = useDate()

export const getBookingLoad = (booked, amount) => {
  if (!amount || booked > amount) return 0

  return Number(((booked * 100) / amount).toFixed(2))
}
export const getYardBookingLoad = items => {
  const obj = {
    amount: 0,
    booked: 0,
  }
  items.forEach(i => {
    obj.amount += i.containers
    obj.booked += i.committed
  })

  return {
    ...obj,
    rate: Number(((obj.booked * 100) / obj.amount).toFixed(2)),
  }
}

export const getContainers = bookings => {
  const today = moment().startOf('day')

  const { committed, containers } = bookings
    .filter(item => moment(item.date).isSameOrAfter(today))
    .reduce(
      (acc, item) => {
        acc.committed += item.committed || 0
        acc.containers += item.containers || 0

        return acc
      },
      { committed: 0, containers: 0 },
    )

  return { committed, containers }
}

export const getNextLoading = bookings => {
  const datesArray = bookings
    .filter(b => b.status === statuses.active)
    .sort((a, b) => moment(a.loadingDate).diff(moment(b.loadingDate)))

  if (!datesArray.length) return {message: "No upcoming loading"}

  return {date: getFormattedDate(datesArray[0]?.loadingDate)}
}
