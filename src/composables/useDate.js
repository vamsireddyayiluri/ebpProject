import moment from 'moment-timezone'

export default () => date => {
  console.log(date)
  
  return moment(date).format('MM/DD/YYYY hh:mm:ss a')
}
