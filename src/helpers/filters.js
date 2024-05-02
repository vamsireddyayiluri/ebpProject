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

  formattedTimeLine.sort((a, b) => {
    const dateA = moment(a.date, 'MM/DD/YYYY hh:mm:ss A')
    const dateB = moment(b.date, 'MM/DD/YYYY hh:mm:ss A')

    return dateB - dateA
  })

  return formattedTimeLine
}
