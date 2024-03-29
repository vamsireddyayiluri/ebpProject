import moment, { utc } from 'moment-timezone'

export const getFormattedDateTime = date => {
  if (!date) return null

  return moment(date).format('MM/DD/YYYY hh:mm:ss a')
}

export const getFormattedDate = date => {
  return moment(date).format('MM/DD/YYYY')
}

export const expiredDate = date => {
  const a = utc(date)
  const b = utc()

  return a.diff(b, 'days')
}

export const todayYesterdayDate = date => {
  if (!expiredDate(date)) {
    return 'Today, ' + moment(new Date()).format('HH:mm A')
  } else if (expiredDate(date) === -1) {
    return 'Yesterday, ' + moment(new Date()).format('HH:mm A')
  } else return moment(date).format('MM/DD/YYYY')
}

export const getSmallerDate = dates => {
  if (dates?.length === 0) {
    return null
  }
  const momentDates = dates.map(date => moment(date))

  const smallestDate = moment.min(momentDates)

  return smallestDate.format()
}
export default () => ({
  getFormattedDateTime,
  getFormattedDate,
  todayYesterdayDate,
  getSmallerDate,
})
