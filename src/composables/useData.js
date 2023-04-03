import { storeToRefs } from 'pinia'
import { useDataStore } from '~/stores/data.store'

export default () => {
  const dataStore = useDataStore()

  const {
    average1,
    average2,
    average3,
    emissions,
    entities,
    exporterMarkers,
    markers,
    marketData,
    rankingData,
    marketplaceData,
    marketplaceMarkers,
    loaded,
  } = storeToRefs(dataStore)

  return {
    average1,
    average2,
    average3,
    emissions,
    entities,
    exporterMarkers,
    markers,
    marketData,
    rankingData,
    marketplaceData,
    marketplaceMarkers,
    loaded,
  }
}
