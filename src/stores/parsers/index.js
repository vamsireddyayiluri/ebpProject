import { getNearestLocation } from '@qualle-admin/qutil/dist/region'
import { streetTurnDailyAverage, streetTurnYearlyAverage } from './average'

import { chain, chunk, countBy, fromPairs, groupBy, keys, map, values } from 'lodash'

export const average1Parser = entities => {
  const { change: value, increase, sum } = streetTurnYearlyAverage(entities)

  return {
    increase,
    message: 'this year',
    sum,
    title: 'Amount of street turns this year',
    value,
  }
}

export const average2Parser = entities => {
  const { change: value, increase, sum } = streetTurnDailyAverage(entities)

  return {
    increase,
    message: 'this year',
    sum: 167,
    title: 'Amount of street turns per day',
    value,
  }
}

export const average3Parser = entities => ({
  message: 'this year',
  sum: 123,
  title: 'Average marketplace dwell time (days)',
  increase: true,
  value: 7,
})

export const entitiesParser = entities =>
  chain(entities)
    .map((entity, index) => ({ ...entity, id: index }))
    .value()

export const markersParser = (entities, locationField) =>
  chain(entities)
    .uniqBy(({ [locationField]: { address } }) => address)
    .map(({ [locationField]: location }) => ({ location, type: locationField }))
    .value()

export const marketDataParser = entities => {
  const series = map(entities, ({ exportLocation }) => ({
    market: getNearestLocation(exportLocation).shift().market,
  }))
  const counts = countBy(series, ({ market }) => market)

  return {
    categories: keys(counts),
    series: [{ data: values(counts) }],
  }
}

export const rankingDataParser = entities => {
  const exporters = groupBy(entities, ({ exportLocation: { label } }) => label)
  const chunkedExporters = chunk(
    chain(exporters)
      .keys()
      .map(exporter => ({
        label: exporter,
        value: exporters[exporter].length,
      }))
      .sortBy('value')
      .reverse()
      .value(),
    10,
  )

  const pagedExporters = fromPairs(
    map(
      map(chunkedExporters, (ranked, index) => ({
        title: `Exporters ${++index}`,
        value: ranked,
      })),
      ({ title, value }) => [title, value],
    ),
  )

  return pagedExporters
}

export const marketplaceDataParser = entities =>
  entities.map((entity, index) => ({ id: index, ...entity }))
