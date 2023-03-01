import { defineStore } from 'pinia'
import {
  average1Parser,
  average2Parser,
  average3Parser,
  entitiesParser,
  markersParser,
  marketDataParser,
  rankingDataParser,
} from './parsers'

export const useDataStore = defineStore('data', () => ({
  average1: average1Parser(),
  average2: average2Parser(),
  average3: average3Parser(),
  entities: entitiesParser(),
  markers: markersParser(),
  marketData: marketDataParser(),
  rankingData: rankingDataParser(),
}))
