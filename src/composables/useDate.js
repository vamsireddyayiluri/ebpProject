import moment from 'moment-timezone'

export default () => date => moment(date).format('MM/DD/YYYY hh:mm:ss a')
