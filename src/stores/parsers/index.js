import { getNearestLocation } from '@qualle-admin/qutil/dist/region'
import { streetTurnDailyAverage, streetTurnYearlyAverage } from './average'

import snapshots from '~/fixtures/snapshots.json'

import {
  chain,
  chunk,
  countBy,
  filter,
  flatMap,
  fromPairs,
  groupBy,
  keys,
  map,
  reduce,
  uniqBy,
  values,
} from 'lodash'

export const average1Parser = () => {
  const { change: value, increase, sum } = streetTurnYearlyAverage(snapshots)

  return {
    increase,
    message: 'this year',
    sum,
    title: 'Amount of street turns this year',
    value,
  }
}

export const average2Parser = () => {
  const { change: value, increase, sum } = streetTurnDailyAverage(snapshots)

  return {
    increase,
    message: 'this year',
    sum,
    title: 'Amount of street turns per day',
    value,
  }
}

export const average3Parser = () => ({
  message: 'this year',
  sum: 123,
  title: 'Average marketplace dwell time (days)',
  increase: true,
  value: 7,
})

export const entitiesParser = () => map(snapshots, (entity, index) => ({ ...entity, id: index }))

export const markersParser = () => {
  const locationsMap = uniqBy([...snapshots], ({ location: { geohash } }) => geohash)

  const filteredLocationsMap = map(
    filter(locationsMap, ({ location: { geohash } }) => geohash),
    ({ location }) => ({ location }),
  )

  const preparedMarkers = flatMap(filteredLocationsMap, ({ location }) => ({
    location,
    containers: filter(snapshots, ({ location: { geohash } }) => geohash === location.geohash),
  }))

  const groupedLocations = map(
    values(groupBy(preparedMarkers, ({ location: { geohash } }) => geohash)),
    group =>
      reduce(group, (prev, { containers }) => ({
        location: prev.location,
        containers: [...prev.containers, ...containers],
      })),
  )

  return groupedLocations
}

export const marketDataParser = () => {
  const series = map(snapshots, ({ exportLocation }) => ({
    market: getNearestLocation(exportLocation).shift().market,
  }))
  const counts = countBy(series, ({ market }) => market)

  return {
    categories: keys(counts),
    series: [{ data: values(counts) }],
  }
}

export const rankingDataParser = () => {
  const exporters = groupBy(snapshots, ({ exportLocation: { label } }) => label)
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
    9,
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
