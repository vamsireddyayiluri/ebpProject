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

import { default as entities } from '~/fixtures/snapshots.json'

export const useDataStore = defineStore('data', () => ({
  average1: average1Parser(entities),
  average2: average2Parser(entities),
  average3: average3Parser(entities),
  entities: entitiesParser(entities),
  markers: markersParser(entities),
  marketData: marketDataParser(entities),
  rankingData: rankingDataParser(entities),
}))
