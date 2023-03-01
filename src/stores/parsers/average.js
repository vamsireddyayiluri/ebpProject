import moment from 'moment-timezone'
import { chain, reduce, size } from 'lodash'

export const streetTurnYearlyAverage = entities => {
  const years = chain(entities)
    .groupBy(({ created }) => moment(created).startOf('year').format())
    .map((group, year) => ({
      year,
      group,
    }))
    .sortBy('year')
    .value()

  const prev = chain(years)
    .filter(({ year }) => moment(year).isSame(moment().subtract(1, 'year'), 'year'))
    .first()
    .get('group')
    .size()
    .value()

  const curr = chain(years)
    .filter(({ year }) => moment(year).isSame(moment(), 'year'))
    .first()
    .get('group')
    .size()
    .value()

  const change = parseInt((curr / prev) * 100).toFixed(0)

  const increase = Boolean(curr > prev)

  return { change, increase, sum: curr }
}

export const streetTurnDailyAverage = entities => {
  const days = chain(entities)
    .groupBy(({ created }) => moment(created).startOf('day').format())
    .map((group, day) => ({
      day,
      group,
    }))
    .sortBy('day')
    .value()

  const prevDays = chain(days)
    .filter(({ day }) => moment(day).isSame(moment().subtract(1, 'year'), 'year'))
    .value()

  const currDays = chain(days)
    .filter(({ day }) => moment(day).isSame(moment(), 'year'))
    .value()

  const prevAverage = reduce(prevDays, (acc, { group }) => acc + size(group), 0) / size(prevDays)
  const currAverage = reduce(currDays, (acc, { group }) => acc + size(group), 0) / size(currDays)
  const change = parseInt(currAverage / prevAverage).toFixed(0)

  const increase = Boolean(Number(currAverage) > Number(prevAverage))
  const sum = parseInt(currAverage).toFixed(0)

  return { change, increase, sum }
}
