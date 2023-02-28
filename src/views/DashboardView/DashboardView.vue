<script setup>
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import { getColor } from '~/helpers/colors.js'
import { uid } from 'uid'
import { delay } from 'lodash'
import moment from 'moment-timezone'

import markersFixture from '~/fixtures/markers'
import imgUrl from '~/assets/icons/default-map-marker.svg'
import { useTheme } from 'vuetify'
import { Main } from '@layouts'

const regions = ref(['All regions', 'SW USA', 'SE USA', 'NW USA', 'NE USA'])
const years = ref(['By years', 'By month', 'By weeks'])
const tab = ref(0)
const rankingDialog = ref(false)

const theme = useTheme()
const computedTheme = computed(() => theme.global.name.value)

const lines = getAllLines()
const statuses = ['approved', 'declined', 'canceled']

const random = arr => arr[Math.floor(Math.random() * arr.length)]

const useData = () =>
  useArrayMap(Array.from(Array(1000).keys()), item => ({
    id: uid(),
    ref: item,
    label: 42268,
    ssl: random(lines).label,
    expiry: moment().add(item, 'days').format('MM/DD/YYYY'),
    status: random(statuses),
    carriers: ['default chip', 'default chip'],
  })).value

const useHeaders = () => [
  {
    text: 'Booking ref',
    value: 'ref',
    sortable: true,
  },
  {
    text: 'Yard label',
    value: 'label',
    sortable: true,
  },
  {
    text: 'SSL',
    value: 'ssl',
    align: 'start',
    sortable: true,
    width: 1,
  },
  {
    text: 'Expiry',
    value: 'expiry',
    sortable: true,
    sorter: (a, b) => moment(a).diff(moment(b)),
  },
  {
    text: 'Status',
    value: 'status',
    align: 'start',
  },
  {
    text: 'Carriers',
    value: 'carriers',
    align: 'start',
    width: 4,
  },
]

const useActions = () => [
  {
    icon: 'mdi-shopping',
    label: 'Add to marketplace',
    action: 'add-to-marketplace',
  },
  {
    icon: 'mdi-swap-horizontal',
    label: 'Transfer containers',
    action: 'transfer-containers',
  },
  {
    icon: 'mdi-arrow-u-down-right',
    label: 'Request turns',
    action: 'request-turns',
  },
  {
    icon: 'mdi-delete',
    label: 'Delete containers',
    action: 'delete-containers',
    color: 'functionalError',
  },
]

const rankingData = ref({
  Exporters: [
    { label: 'General Motors', value: 700 },
    { label: 'American Chung Nam', value: 600 },
    { label: 'Koch Industries', value: 550 },
  ],
  'Exporters 2': [
    { label: 'Louis Dreyfus Company', value: 500 },
    { label: 'DeLong', value: 400 },
    { label: 'International Paper', value: 370 },
  ],
  'Exporters 3': [
    { label: 'Shintech', value: 370 },
    { label: 'General Motors', value: 350 },
    { label: 'Georgia Pacific', value: 300 },
  ],
})

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
const onExpand = () => {
  rankingDialog.value.show(true)
}
const onSelectRank = e => console.log(e)
let { markers } = markRaw({
  markers: markersFixture,
})

const mapOptions = markRaw({ zoom: 3, zoomControls: true })
const mapHeight = `${window.innerHeight - 121}px`
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

const onSplitPaneClosed = e => {
  toggleMap()
}

const loading = ref(false)
const showActions = ref(true)
const showSelect = ref(true)

const entities = useData()
const headers = useHeaders()
const actions = useActions()

const onAction = (e, action) => {
  console.log({ action, e })

  loading.value = true

  delay(() => (loading.value = false), 1500)
}
const onSelect = e => {
  computedSelected.value = e
}
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
          <VContainer class="bg-background px-8 pb-6 pt-10" fluid>
            <VRow no-gutters class="gap-5">
              <VCol :style="{ minWidth: '250px' }">
                <AverageCard
                  v-bind="{
                    message: 'this year',
                    sum: 123,
                    title: 'Amount of street turns per year',
                    increase: false,
                    value: 7,
                  }"
                />
              </VCol>
              <VCol :style="{ minWidth: '250px' }">
                <AverageCard
                  v-bind="{
                    message: 'this year',
                    sum: 123,
                    title: 'Amount of street turns per year',
                    increase: false,
                    value: 7,
                  }"
                />
              </VCol>
              <VCol :style="{ minWidth: '250px' }">
                <AverageCard
                  v-bind="{
                    message: 'this year',
                    sum: 123,
                    title: 'Average marketplace dwell time (days)',
                    increase: true,
                    value: 7,
                  }"
                />
              </VCol>
            </VRow>
            <VRow no-gutters class="my-10 gap-5">
              <VCol :style="{ minWidth: '350px' }">
                <TurnsChart />
              </VCol>
              <VCol :style="{ minWidth: '350px' }">
                <RankingCard
                  title="Ranking by street turns"
                  :data="rankingData"
                  @onDownload="onDownload"
                  @onExpand="onExpand"
                  @onSelect="onSelectRank"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol>
                <VRow no-gutters align="baseline" justify="space-between">
                  <Typography type="text-h2" class="mb-7"> Turns</Typography>
                  <ButtonToggle
                    v-model="tab"
                    :items="[{ label: 'Turns' }, { label: 'Marketplace' }]"
                    density="compact"
                  />
                </VRow>
                <VirtualTable
                  :entities="entities"
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
                      {{ item.ref }}
                    </Typography>
                  </template>
                  <template #label="{ item }">
                    <Typography type="text-body-m-regular">
                      {{ item.label }}
                    </Typography>
                  </template>
                  <template #ssl="{ item }">
                    <Typography
                      class="text-truncate"
                      type="text-body-m-regular"
                      :style="{ width: '5rem' }"
                    >
                      {{ item.ssl }}
                      <Tooltip>
                        {{ item.ssl }}
                      </Tooltip>
                    </Typography>
                  </template>
                  <template #expiry="{ item }">
                    <Typography type="text-body-m-regular">
                      {{ item.expiry }}
                    </Typography>
                  </template>
                  <template #status="{ item }">
                    <Classification type="status" :value="item.status" />
                  </template>
                  <template #carriers="{ item }">
                    <Chip
                      v-for="trucker in item.carriers"
                      :key="trucker"
                      class="mr-1"
                      avatar
                      size="small"
                    >
                      <Avatar size="small" start />
                      {{ trucker }}
                    </Chip>
                    <Typography class="text-truncate" type="text-body-xs-semibold">
                      +3 carriers
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
          <!--Dialogs-->

          <Dialog ref="rankingDialog" width="50%" min-width="400px">
            <template #text>
              <div class="pa-0">
                <VRow no-gutters align="baseline" justify="space-between">
                  <VRow no-gutters align="center">
                    <Typography type="text-h3">Ranking by street turns</Typography>
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
                    <Tooltip location="top"> Download in CSV </Tooltip>
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
            :style="{ height: '1200px' }"
            :map-options="mapOptions"
            :markers="markers"
            :render-info-window="renderInfoWindow"
            :render-marker-icon="renderMarkerIcon"
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
}
</style>
