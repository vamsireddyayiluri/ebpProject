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

export const useDataStore = defineStore({
  id: 'data',
  state: () => ({
    average1: null,
    average2: null,
    average3: null,
    entities: [],
    markers: [],
    marketData: null,
    rankingData: null,
    marketplaceData: [],
    marketplaceMarkers: [],
    loaded: false,
  }),

  actions: {
    async parseData() {
      const entitiesStore = useEntitiesStore()
      const entities = await entitiesStore.loadEntities(import.meta.env.VITE_APP_LINE_ID)

      this.average1 = average1Parser(entities)
      this.average2 = average2Parser(entities)
      this.average3 = average3Parser(entities)
      this.entities = entitiesParser(entities)
      this.markers = markersParser(entities)
      this.marketData = marketDataParser(entities)
      this.rankingData = rankingDataParser(entities)
      this.marketplaceData = marketplaceDataParser(marketplaceEntities)
      this.marketplaceMarkers = markersParser(marketplaceDataParser(marketplaceEntities))
      this.loaded = true
    },
  },
})
