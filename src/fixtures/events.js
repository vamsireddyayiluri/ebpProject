import moment from 'moment-timezone'

let eventGuid = 0
const today = moment()

const createEventId = () => String(eventGuid++)

export const getEvent = () => ({
  id: createEventId(),
  title: 'Ref#4489',
  start: today.format('YYYY-MM-DD'),
  end: today.add(1, 'week').format('YYYY-MM-DD'),
  metadata: {
    name: 'event-9',
    ref: 90216,
    progress: 69,
    carriers: [
      { scac: 'OTRH', fulfilled: 6, total: 13 },
      { scac: 'ARYE', fulfilled: 2, total: 5 },
      { scac: 'LORE', fulfilled: 12, total: 14 },
      { scac: 'WNER', fulfilled: 3, total: 10 },
      { scac: 'ABOR', fulfilled: 6, total: 13 },
      { scac: 'ABOR', fulfilled: 2, total: 5 },
    ],
  },
})
