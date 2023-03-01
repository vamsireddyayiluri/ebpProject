<script setup>
import { getColor } from '~/helpers/colors'
import { delay } from 'lodash'

import imgUrl from '~/assets/icons/default-map-marker.svg'
import { useTheme } from 'vuetify'
import { Main } from '@layouts'

import { useActions, useHeaders, useData, useDate } from '~/composables'

const theme = useTheme()
const computedTheme = computed(() => theme.global.name.value)

const { average1, average2, average3, entities, markers, marketData, rankingData } = toRefs(
  useData(),
)
const headers = useHeaders()
const actions = useActions()
const formatDate = useDate()

const filteredEntities = ref(entities.value)

const regions = ref(['All regions', 'SW USA', 'SE USA', 'NW USA', 'NE USA'])
const years = ref(['By years', 'By month', 'By weeks'])

const tab = ref(0)

const rankingDialog = ref(false)
const loading = ref(false)
const showActions = ref(false)
const showSelect = ref(false)
const searchValue = ref(null)

const mutableSelected = ref(Object.keys(rankingData.value)[0])
const computedSelected = computed({
  get() {
    return mutableSelected.value
  },
  set(value) {
    mutableSelected.value = value
  },
})
const computedValues = computed(() => rankingData.value[computedSelected.value])

const onDownload = e => console.log(e)
const onExpand = () => rankingDialog.value.show(true)
const onSelectRank = e => console.log(e)

const mapHeight = `${window.innerHeight - 121}px`
const mapOptions = markRaw({ zoom: 3, zoomControls: true })
const onMapLoaded = async ({ api, map }) => console.log({ api, map })
const onMarkerClick = e => console.log(JSON.stringify(e))
const renderInfoWindow = marker => JSON.stringify(marker)
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

const onAction = (e, action) => {
  console.log({ action, e })

  loading.value = true

  delay(() => (loading.value = false), 1500)
}

const onSelect = e => {
  computedSelected.value = e
}

const onClearSearch = () => {
  loading.value = true

  setTimeout(() => {
    filteredEntities.value = entities.value

    loading.value = false
  }, 1000)
}

const debouncedSearch = useDebounceFn(() => {
  loading.value = true

  setTimeout(() => {
    if (!searchValue.value) {
      onClearSearch()
    } else {
      filteredEntities.value = useArrayFilter(entities.value, entity =>
        useArrayMap(Object.values(entity), entity => String(entity).toLowerCase()).value.includes(
          searchValue.value.toLowerCase(),
        ),
      ).value
    }

    loading.value = false
  }, 1000)
}, 300)

watch(searchValue, _ => debouncedSearch())
</script>

<template>
  <Main class="dashboardView">
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
      <Panes ref="panesRef" :panes="panes" @onSplitPaneClosed="onSplitPaneClosed">
        <template #content class="test">
          <VContainer class="content bg-background px-8 pb-6 pt-10" fluid>
            <VRow no-gutters class="gap-5">
              <VCol :style="{ minWidth: '250px' }">
                <AverageCard v-bind="average1" />
              </VCol>
              <VCol :style="{ minWidth: '250px' }">
                <AverageCard v-bind="average2" />
              </VCol>
              <VCol :style="{ minWidth: '250px' }">
                <AverageCard v-bind="average3" />
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
                  <Typography type="text-h2"> Turns </Typography>
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
                  :entities="filteredEntities"
                  :headers="headers"
                  :loading="loading"
                  :options="{
                    rowHeight: 64,
                    showActions,
                    showSelect,
                    tableHeight: 575,
                    tableMinWidth: '960',
                  }"
                  @onScroll="() => {}"
                  @onSelectRow="() => {}"
                  @onSort="() => {}"
                  @onUpdated="() => {}"
                >
                  <template #ref="{ item }">
                    <Typography type="text-body-m-regular">
                      {{ item.ref || '--' }}
                    </Typography>
                  </template>
                  <template #container="{ item }">
                    <Typography type="text-body-m-regular text-uppercase">
                      {{ item.container }}
                    </Typography>
                  </template>
                  <template #size="{ item }">
                    <Typography type="text-body-m-regular">
                      {{ item.size }}
                    </Typography>
                  </template>
                  <template #created="{ item }">
                    <Typography type="text-body-m-regular">
                      {{ formatDate(item.created) }}
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
              <div class="pa-0">
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
              </div>
            </template>
          </Dialog>
        </template>
        <template #map>
          <Map
            :map-options="mapOptions"
            :markers="markers"
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
    height: v-bind(mapHeight) !important;

    &:hover {
      overflow: auto;
    }
  }

  .google-map-wrapper {
    height: v-bind(mapHeight) !important;
  }

  .styledVCard {
    justify-content: space-between;
    display: flex;
    flex-direction: column;
  }

  .content {
    min-width: 50vw;
    overflow: overlay;

    &::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
  }
}
</style>
