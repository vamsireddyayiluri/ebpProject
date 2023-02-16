<script setup>
import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import { uid } from 'uid'
import { delay } from 'lodash'
import moment from 'moment-timezone'

import markersFixture from '@/fixtures/markers'
import imgUrl from '@/assets/icons/default-map-marker.svg'

import { useTheme } from 'vuetify'

const theme = useTheme()
const computedTheme = computed(() => theme.global.name.value)

const lines = getAllLines()
const statuses = ['approved', 'declined', 'canceled']

const random = (arr) => arr[Math.floor(Math.random() * arr.length)]

const useData = () =>
  useArrayMap(Array.from(Array(1000).keys()), (item) => ({
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

const charts = [
  {
    label: 'Turns by market',
    settings: { horizontal: true, type: 'bar', showLabels: false },
    data: {
      categories: [
        'LA/LGB',
        'NJ/NEWARK',
        'TX/HOUSTON',
        'GA/SAVANNAH',
        'SF/OAKLAND',
        'NW/SEATTLE',
        'LA/LGB',
      ],
      series: [{ data: [140, 90, 95, 130, 170, 105, 120] }],
    },
  },
  {
    label: 'Ranking by street turns',
    settings: { type: 'area', showLabels: false },
    data: {
      categories: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      series: [{ data: [20, 50, 40, 70, 50, 90, 40, 100, 80, 120, 70, 140] }],
    },
  },
]

let { markers } = markRaw({
  markers: markersFixture,
})

const mapOptions = markRaw({ zoom: 3, zoomControls: true })
const mapHeight = `${window.innerHeight - 130}px`
const onMapLoaded = async ({ api, map }) => console.log({ api, map })
const onMarkerClick = (e) => console.log(JSON.stringify(e))
const renderInfoWindow = (marker) => JSON.stringify(marker)
const renderMarkerIcon = () => imgUrl

const panes = ref([
  { name: 'content', size: 50 },
  { name: 'map', size: 50 },
])

const onSplitPaneClosed = (e) => console.log(JSON.stringify(e))

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
</script>

<template>
  <ThemeSwitcher :style="{ position: 'fixed', top: '-4px', right: '9em' }" />
  <VContainer class="bg-background ma-0 pa-0" fluid>
    <Panes :panes="panes" @onSplitPaneClosed="onSplitPaneClosed">
      <template #content>
        <VContainer
          class="bg-background pl-8 pr-0 pb-4 pt-4"
          fluid
          :style="{ minWidth: '960px' }"
        >
          <VRow>
            <VCol>
              <AverageCard
                v-bind="{
                  message: 'this year',
                  sum: 123,
                  title: 'Amount of street turns per year',
                  increase: false,
                  value: 7,
                }"
                :style="{ height: '142.398px' }"
              />
            </VCol>
            <VCol>
              <AverageCard
                v-bind="{
                  message: 'this year',
                  sum: 123,
                  title: 'Amount of street turns per year',
                  increase: false,
                  value: 7,
                }"
                :style="{ height: '142.398px' }"
              />
            </VCol>
            <VCol>
              <AverageCard
                v-bind="{
                  message: 'this year',
                  sum: 123,
                  title: 'Average marketplace dwell time (days)',
                  increase: true,
                  value: 7,
                }"
                :style="{ height: '142.398px' }"
              />
            </VCol>
          </VRow>
          <VRow>
            <VCol
              v-for="({ label, settings, data }, n) in charts"
              :key="n"
              cols="6"
            >
              <Card elevation="0">
                <CardTitle>{{ label }}</CardTitle>
                <Chart
                  :options="
                    ({ colors, dark }) => ({
                      chart: {
                        type: settings.type,
                        height: 280,
                        // background: colors.uiBackground,
                        animations: {
                          enabled: false,
                        },
                        toolbar: { show: false },
                      },
                      colors: [colors.uiChart],
                      plotOptions: {
                        bar: {
                          horizontal: settings.horizontal,
                          ...(settings.horizontal && { barHeight: '20%' }),
                          borderRadius: 4,
                          startingShape: 'rounded',
                          endingShape: 'rounded',
                          distributed: false,
                          colors: {
                            backgroundBarColors: ['transparent'],
                            backgroundBarOpacity: 0,
                            backgroundBarRadius: 4,
                          },
                        },
                      },
                      legend: { show: false },
                      dataLabels: {
                        enabled: settings.showLabels,
                        formatter: (n) => `${n}%`,
                      },
                      grid: {
                        show: true,
                        borderColor: colors.uiLine,
                      },
                      xaxis: {
                        show: true,
                        categories: data.categories,
                        labels: {
                          show: true,
                          style: {
                            colors: colors.textSecondary,
                          },
                        },
                        axisBorder: { show: true, color: colors.uiLine },
                        axisTicks: { show: true },
                      },
                      yaxis: {
                        show: true,
                        labels: {
                          show: true,
                          style: {
                            colors: colors.textSecondary,
                          },
                        },
                        axisBorder: { show: true, color: colors.uiLine },
                      },
                      tooltip: {
                        enabled: true,
                        intersect: false,
                        theme: dark,
                      },
                    })
                  "
                  :data="data"
                />
              </Card>
            </VCol>
          </VRow>
          <VRow>
            <VCol>
              <Typography type="text-h2" class="mb-4">Turns</Typography>
              <VirtualTable
                :entities="entities"
                :headers="headers"
                :loading="loading"
                :options="{
                  rowHeight: 64,
                  showActions,
                  showSelect,
                  tableHeight: 575,
                  tableMinWidth: 960,
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
                  <Typography
                    class="text-truncate"
                    type="text-body-xs-semibold"
                  >
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
                        @click="
                          onAction(selected.length ? selected : [item], action)
                        "
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
</template>

<style lang="scss">
.splitpanes {
  background: transparent !important;
}
.splitpanes__pane {
  height: v-bind(mapHeight) !important;

  &:hover {
    overflow: overlay;
    overflow-y: auto;
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
</style>
