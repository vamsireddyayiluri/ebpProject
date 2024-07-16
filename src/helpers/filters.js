import moment from 'moment-timezone'
import { useDate } from '~/composables'

const { getFormattedDateTime } = useDate()
export const filterMatchingObjects = (searchedData, filteredData, key = 'id') => {
  const map = new Map()

  for (const obj of searchedData) {
    const keyValue = obj[key]
    map.set(keyValue, obj)
  }

  const intersection = []

  for (const obj of filteredData) {
    const keyValue = obj[key]
    if (map.has(keyValue)) {
      intersection.push(obj)
    }
  }

  return intersection
}

export const getTimeLine = timeLine => {
  let formattedTimeLine = timeLine?.map(val => {
    return { title: val.message, date: getFormattedDateTime(val.time_stamp) }
  })

  formattedTimeLine?.sort((a, b) => {
    const dateA = moment(a.date, 'MM/DD/YYYY hh:mm:ss A')
    const dateB = moment(b.date, 'MM/DD/YYYY hh:mm:ss A')

    return dateB - dateA
  })

  return formattedTimeLine
}
export const getExtremeDate = (details, findMostRecent) => {
  return details.reduce((extremeDate, detail) => {
    const currentDate = moment(detail.loadingDate)
    if (findMostRecent) {
      return !extremeDate || currentDate.isAfter(extremeDate) ? currentDate : extremeDate
    } else {
      return !extremeDate || currentDate.isBefore(extremeDate) ? currentDate : extremeDate
    }
  }, null)
}
export const sortBy = (entities, by) => {
  const findMostRecent = by === 'mostRecent'
  const byDefault = by === 'default' || by === null

  if (byDefault) {
    return entities.sort((a, b) => moment(b.updatedAt).diff(moment(a.updatedAt)))
  }

  return entities.sort((a, b) => {
    const dateA = getExtremeDate(a.details, findMostRecent)
    const dateB = getExtremeDate(b.details, findMostRecent)

    if (findMostRecent) {
      return dateB.diff(dateA)
    } else {
      return dateA.diff(dateB)
    }
  })
}
