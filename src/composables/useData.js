import { useDataStore } from '~/stores/data.store'

export default () => {
  const store = useDataStore()

  const {
    average1,
    average2,
    average3,
    entities,
    markers,
    marketData,
    rankingData,
    reservationsData,
    reservationsMarkers,
  } = store

  return {
    average1,
    average2,
    average3,
    entities,
    markers,
    marketData,
    rankingData,
    reservationsData,
    reservationsMarkers,
  }
}
