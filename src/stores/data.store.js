import { defineStore } from 'pinia'
import { useEntitiesStore } from './entities.store'

import {
  average1Parser,
  average2Parser,
  average3Parser,
  entitiesParser,
  markersParser,
  marketDataParser,
  rankingDataParser,
  marketplaceDataParser,
} from './parsers'

import marketplaceEntities from '~/fixtures/marketplace.json'

export const useDataStore = defineStore('data', () => {
  const average1 = ref(null),
    average2 = ref(null),
    average3 = ref(null),
    emissions = ref({}),
    entities = ref([]),
    exporterMarkers = ref([]),
    markers = ref([]),
    marketData = ref(null),
    rankingData = ref(null),
    marketplaceData = ref([]),
    marketplaceMarkers = ref([]),
    loaded = ref(false)

  const parseData = async () => {
    const entitiesStore = useEntitiesStore()
    const rawEntities = await entitiesStore.loadEntities(import.meta.env.VITE_APP_LINE_ID)
    const rawEmissions = await entitiesStore.loadEmissions()

    average1.value = average1Parser(rawEntities)
    average2.value = average2Parser(rawEntities)
    average3.value = average3Parser(rawEntities)
    emissions.value = rawEmissions
    entities.value = entitiesParser(rawEntities)
    exporterMarkers.value = markersParser(rawEntities, 'exportLocation')
    markers.value = markersParser(rawEntities, 'location')
    marketData.value = marketDataParser(rawEntities)
    rankingData.value = rankingDataParser(rawEntities)
    marketplaceData.value = marketplaceDataParser(marketplaceEntities)
    marketplaceMarkers.value = markersParser(marketplaceDataParser(marketplaceEntities), 'location')

    setTimeout(() => {
      loaded.value = true
    }, 5000)
  }

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
    parseData,
  }
})
