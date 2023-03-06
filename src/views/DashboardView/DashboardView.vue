<script setup>
import { getColor } from '~/helpers/colors'

import imgUrl from '~/assets/icons/default-map-marker.svg'
import { useTheme } from 'vuetify'
import { Main } from '@layouts'

import { useActions, useHeaders, useData, useDate } from '~/composables'
import { markersParser } from '~/stores/parsers'

import { useDataStore } from '~/stores/data.store'

const dataStore = useDataStore()

const theme = useTheme()
const computedTheme = computed(() => theme.global.name.value)

const {
  average1,
  average2,
  average3,
  entities,
  markers,
  marketData,
  rankingData,
  marketplaceData,
  marketplaceMarkers,
  loaded,
} = useData()

const { turnsHeaders, marketplaceHeaders } = useHeaders()
const actions = useActions()
const formatDate = useDate()

const regions = ref(['All regions', 'SW USA', 'SE USA', 'NW USA', 'NE USA'])
const years = ref(['By years', 'By month', 'By weeks'])

const tab = ref(0)

const rankingDialog = ref(false)
const loading = ref(false)
const showActions = ref(false)
const showSelect = ref(false)
const searchValue = ref(null)
const paneOpened = ref(false)

const count = ref(0)
const counting = setInterval(function () {
  if (count.value < 100) {
    count.value++
  } else {
    clearInterval(counting)
  }
}, 50)

const mutableSelected = ref(null)
const mutableEntities = ref(entities.value)
const mutableMarkers = ref(markers.value)

const computedTabs = computed(() => ({ 0: 'default', 1: 'marketplace' }))
const computedDefaultTab = computed(() => computedTabs.value[tab.value] === 'default')
const computedSelected = computed({
  get() {
    return mutableSelected.value
  },
  set(value) {
    mutableSelected.value = value
  },
})
const computedMarkers = computed({
  get() {
    return mutableMarkers.value
  },
  set(value) {
    mutableMarkers.value = value
  },
})
const computedEntities = computed({
  get() {
    return mutableEntities.value
  },
  set(value) {
    mutableEntities.value = value
  },
})

const computedHeaders = computed(() =>
  computedDefaultTab.value ? turnsHeaders : marketplaceHeaders,
)
const computedValues = computed(() => rankingData.value[computedSelected.value])

const onDownload = e => console.log(e)
const onExpand = () => rankingDialog.value.show(true)
const onSelectRank = e => console.log(e)

const mapOptions = markRaw({ zoom: 3, zoomControls: true })
const onMapLoaded = ({ api, map }) => console.log({ api, map })
const onMarkerClick = e => console.log(JSON.stringify(e))
const renderInfoWindow = ({ containers }) => String(`${containers.length} containers`)
const renderMarkerIcon = () => imgUrl

const panes = ref([
  { name: 'content', size: 50 },
  { name: 'map', size: 50 },
])
const panesRef = ref(null)
const mapToggled = ref(true)

const toggleMap = () => {
  const panes = toRaw(panesRef.value)
  panes.toggleMap()
  mapToggled.value = !mapToggled.value
}

const onSplitPaneClosed = e => toggleMap()
const onSplitPaneResized = e => {
  const { size } = useArrayFindLast(e, element => element).value

  paneOpened.value = Boolean(size >= 60)
}
const onSplitterClicked = e => {
  const { size } = e

  paneOpened.value = Boolean(size < 100)
}

const onAction = (e, action) => {
  console.log({ action, e })

  loading.value = true

  setTimeout(() => (loading.value = false), 1500)
}

const onSelect = e => {
  computedSelected.value = e
}

const onUpdated = e => {
  computedMarkers.value = markersParser(e)
}

const onClearSearch = () => {
  loading.value = true

  setTimeout(() => {
    computedEntities.value = computedDefaultTab.value ? entities.value : marketplaceData.value

    loading.value = false
  }, 1000)
}

const debouncedSearch = useDebounceFn(searchValue => {
  if (!searchValue) {
    onClearSearch()
  } else {
    computedEntities.value = useArrayFilter(
      computedDefaultTab.value ? entities : marketplaceData,
      ({ container, ref, size }) =>
        useArraySome(
          useArrayMap(Object.values({ container, ref, size }), value => String(value).toLowerCase())
            .value,
          values => values.includes(searchValue.toLowerCase()),
        ).value,
    ).value
  }
}, 300)

watch(searchValue, value => debouncedSearch(value))
watch([entities, tab], () => {
  searchValue.value = null
  computedEntities.value = computedDefaultTab.value ? entities.value : marketplaceData.value
  computedMarkers.value = computedDefaultTab.value ? markers.value : marketplaceMarkers.value
})

onMounted(async () => {
  await dataStore.parseData()
})
</script>

<template>
  <Main v-if="loaded" class="dashboardView">
    <SubHeader>
      <template #controls>
        <SimpleSelect :items="regions" :selected="regions[0]" />
        <Divider vertical class="my-2 mx-4" />
        <SimpleSelect :items="years" @onSelect="onSelect" />
        <Divider vertical class="my-2 mx-4" />
        <div class="d-flex align-center">
          <IconButton icon="mdi-chevron-left" />
          <IconButton class="mr-2" icon="mdi-chevron-right" />
          <Typography type="text-body-s-regular" :color="getColor('textSecondary')">
            2022
          </Typography>
        </div>
      </template>
      <template #actions>
        <Button
          prepend-icon="mdi-map-marker"
          variant="plain"
          v-bind="!mapToggled && { secondary: 'false' }"
          @click="toggleMap"
        >
          Map
        </Button>
      </template>
    </SubHeader>
    <VContainer class="bg-background ma-0 pa-0" fluid>
      <Panes
        ref="panesRef"
        :panes="panes"
        @onSplitPaneClosed="onSplitPaneClosed"
        @onSplitPaneResized="onSplitPaneResized"
        @onSplitterClicked="onSplitterClicked"
      >
        <template #content>
          <VContainer class="content bg-background px-8 pb-6 pt-10" fluid>
            <VRow no-gutters class="gap-5">
              <VCol :style="{ minWidth: '250px' }">
                <AverageCard class="fill-height" v-bind="average1" />
              </VCol>
              <VCol :style="{ minWidth: '250px' }">
                <AverageCard class="fill-height" v-bind="average2" />
              </VCol>
              <VCol :style="{ minWidth: '250px' }">
                <AverageCard class="fill-height" v-bind="average3" />
              </VCol>
            </VRow>
            <VRow no-gutters class="my-10 gap-5">
              <VCol :style="{ minWidth: '350px' }">
                <TurnsChart
                  :charts="{
                    label: 'Turns by market',
                    settings: { horizontal: true, type: 'bar', showLabels: false },
                    data: marketData,
                  }"
                />
              </VCol>
              <VCol :style="{ minWidth: '350px' }">
                <RankingCard
                  class="fill-height"
                  title="Ranking by exporters"
                  :data="rankingData"
                  @onDownload="onDownload"
                  @onExpand="onExpand"
                  @onSelect="onSelectRank"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol>
                <VRow class="mb-7" no-gutters align="center" justify="space-between">
                  <Typography type="text-h2">
                    {{ computedDefaultTab ? 'Turns' : 'Marketplace' }}
                  </Typography>
                  <ButtonToggle
                    v-model="tab"
                    :items="[{ label: 'Turns' }, { label: 'Marketplace' }]"
                    density="compact"
                  />
                </VRow>

                <VRow class="mb-4" no-gutters align="center" justify="space-between">
                  <Textfield
                    v-model="searchValue"
                    class="mr-4"
                    type="text"
                    placeholder="Search..."
                    prepend-inner-icon="mdi-magnify"
                    clearable
                    @click:clear="onClearSearch"
                  />
                  <Autocomplete class="mr-4" placeholder="Container #" />
                  <Autocomplete placeholder="Size / Type" />
                  <VSpacer />
                  <IconButton
                    class="border"
                    icon="mdi-download"
                    size="24"
                    width="48"
                    min-width="48"
                    height="48"
                    variant="plain"
                  >
                    <Tooltip location="top"> Download PDF </Tooltip>
                  </IconButton>
                </VRow>
                <VirtualTable
                  :key="tab"
                  :entities="computedEntities"
                  :headers="computedHeaders"
                  :loading="loading"
                  :options="{
                    rowHeight: 64,
                    showActions,
                    showSelect,
                    tableHeight: 511,
                    tableMinWidth: 1440,
                  }"
                  @onScroll="() => {}"
                  @onSelectRow="() => {}"
                  @onSort="() => {}"
                  @onUpdated="onUpdated"
                >
                  <template #ref="{ item: { ref } }">
                    <Typography type="text-body-m-regular text-uppercase">
                      <Highlighter v-if="searchValue" :query="searchValue">
                        {{ ref || '--' }}
                      </Highlighter>
                      <template v-else>
                        {{ ref || '--' }}
                      </template>
                    </Typography>
                  </template>
                  <template #container="{ item: { container } }">
                    <Typography type="text-body-m-regular text-uppercase">
                      <Highlighter v-if="searchValue" :query="searchValue">
                        {{ container }}
                      </Highlighter>
                      <template v-else>
                        {{ container }}
                      </template>
                    </Typography>
                  </template>
                  <template #size="{ item: { size } }">
                    <Typography type="text-body-m-regular">
                      <Highlighter v-if="searchValue" :query="searchValue">
                        {{ size }}
                      </Highlighter>
                      <template v-else>
                        {{ size }}
                      </template>
                    </Typography>
                  </template>
                  <template #created="{ item }">
                    <Typography type="text-body-m-regular">
                      {{ formatDate(item.created) }}
                    </Typography>
                  </template>
                  <template
                    #location="{
                      item: {
                        location: { address, label },
                      },
                    }"
                  >
                    <LocationItems
                      :locations="[
                        {
                          id: 0,
                          value: address,
                          label,
                        },
                      ]"
                      :style="{ width: '100%' }"
                    />
                  </template>
                  <template #status="{ item }">
                    <Classification
                      class="overflow-visible mr-2"
                      type="status"
                      :value="item.status"
                    />
                    <Typography type="text-body-s-regular">
                      {{ formatDate(item.approved || item.declined || item.canceled) }}
                    </Typography>
                  </template>
                  <template #actions="{ item, selected }">
                    <Menu location="bottom end" offset="3">
                      <template #activator="{ props, isActive }">
                        <IconButton
                          v-bind="props"
                          icon="mdi-dots-horizontal"
                          variant="plain"
                          :focused="isActive"
                        />
                      </template>

                      <List>
                        <ListItem
                          v-for="({ action, color, icon, label }, n) in actions"
                          :key="n"
                          :color="color"
                          @click="onAction(selected.length ? selected : [item], action)"
                        >
                          <template #prepend>
                            <Icon :color="color" :icon="icon" />
                          </template>
                          <ListItemTitle :color="color">
                            {{ label }}
                            <Badge
                              v-if="selected.length"
                              color="uiInteractive"
                              :content="selected.length"
                              inline
                            />
                          </ListItemTitle>
                        </ListItem>
                      </List>
                    </Menu>
                  </template>
                </VirtualTable>
              </VCol>
            </VRow>
          </VContainer>
          <!-- Dialogs -->

          <Dialog ref="rankingDialog" width="50%" min-width="400px">
            <template #text>
              <VRow no-gutters align="baseline" justify="space-between">
                <VRow no-gutters align="center" class="mb-4">
                  <Typography type="text-h3"> Ranking by exporters </Typography>
                  <SimpleSelect
                    :items="Object.keys(rankingData)"
                    :selected="computedSelected"
                    class="ml-4"
                    @onSelect="onSelect"
                  />
                </VRow>
                <IconButton
                  icon="mdi-download"
                  size="20"
                  width="32"
                  min-width="32"
                  height="32"
                  variant="plain"
                >
                  <Tooltip location="top"> Download PDF </Tooltip>
                </IconButton>
              </VRow>
              <div
                v-for="(rank, n) of computedValues"
                :key="n"
                class="d-flex justify-space-between mt-2"
              >
                <Typography type="text-body-s-regular" :color="getColor('textSecondary')">
                  {{ rank.label }}
                </Typography>
                <Typography type="text-body-s-semibold">
                  {{ rank.value }}
                </Typography>
              </div>
            </template>
          </Dialog>
        </template>
        <template #map>
          <VFadeTransition>
            <div
              v-if="paneOpened"
              class="styledMapFilters d-flex position-absolute ma-8"
              no-gutters
              align="center"
            >
              <VSpacer />
              <Autocomplete
                class="styledMapFilter bg-uiPrimary mr-4 rounded-sm"
                placeholder="Age of containers"
              />
              <Autocomplete
                class="styledMapFilter bg-uiPrimary mr-4 rounded-sm"
                placeholder="Containers in marketplace"
              />
              <Autocomplete
                class="styledMapFilter bg-uiPrimary rounded-sm"
                placeholder="Exporter facilities"
              />
            </div>
          </VFadeTransition>
          <Map
            :key="tab"
            :map-options="mapOptions"
            :markers="computedMarkers"
            :render-info-window="renderInfoWindow"
            :render-marker-icon="renderMarkerIcon"
            :render-marker-cluster="true"
            :theme="computedTheme"
            @onMapLoaded="onMapLoaded"
            @onMarkerClick="onMarkerClick"
          />
        </template>
      </Panes>
    </VContainer>
  </Main>
  <VContainer v-else class="progress-wrapper d-flex align-center justify-center" fluid>
    <ProgressCircular :size="350" :value="count" text="Loading..."> {{ count }}% </ProgressCircular>
  </VContainer>
</template>

<style lang="scss">
.dashboardView {
  .gap-5 {
    gap: 1.25rem;
  }
  .styledSubHeader {
    .v-toolbar__content {
      height: 56px !important;
    }
  }

  .splitpanes {
    background: transparent !important;
  }

  .splitpanes__pane {
    height: calc(100vh - 121px);
    position: relative;
  }

  .google-map-wrapper {
    height: calc(100vh - 121px);
  }

  .styledVCard {
    justify-content: space-between;
    display: flex;
    flex-direction: column;
  }

  .content {
    min-width: 480px;
  }

  .styledMapFilters {
    top: 0;
    right: 0;
    z-index: 5;

    > .styledMapFilter {
      width: 280px;
    }
  }
}

.progress-wrapper {
  height: 100vh;
}
</style>
