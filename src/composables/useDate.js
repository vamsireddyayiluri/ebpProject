import moment from 'moment-timezone'

export const getFormattedDateTime = date => {
  if (!date) return null
  
  return moment(date).format('MM/DD/YYYY hh:mm:ss a')
}

export const getFormattedDate = date => {
  return moment(date).format('MM/DD/YYYY')
}

export default () => ({
  getFormattedDateTime,
  getFormattedDate,
})
