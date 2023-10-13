export const bookingsHeaders = [
  {
    text: 'Ref #',
    value: 'ref',
    align: 'start',
    width: 2,
  },
  {
    text: 'Yard label',
    value: 'yardLabel',
  },
  {
    text: 'SSL',
    value: 'ssl',
  },
  {
    text: 'Expiry',
    value: 'expiry',
  },
  {
    text: 'Progress',
    value: 'progress',
  },
]
export const yardsHeaders = [
  {
    text: 'Yard label',
    value: 'yardLabel',
    align: 'start',
    width: 3,
  },
  {
    text: 'Location',
    value: 'location',
  },
  {
    text: 'Progress',
    value: 'progress',
  },
]
export default () => ({
  bookingsHeaders,
  yardsHeaders,
})
