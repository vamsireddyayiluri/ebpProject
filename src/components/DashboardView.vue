<script setup>
import {
  Avatar,
  AverageCard,
  Badge,
  Chip,
  Classification,
  IconButton,
  List,
  ListItem,
  ListItemTitle,
  Menu,
  Tooltip,
  Typography,
  VirtualTable,
  ThemeSwitcher,
} from '@qualle-admin/qui'

import { getAllLines } from '@qualle-admin/qutil/dist/ssl'
import { uid } from 'uid'
import { delay } from 'lodash'
import moment from 'moment-timezone'

const lines = getAllLines()
const statuses = ['approved', 'declined', 'canceled']

const random = (arr) => arr[Math.floor(Math.random() * arr.length)]

const useData = () =>
  Array.from(Array(1000).keys()).map((item) => ({
    id: uid(),
    ref: item,
    label: 42268,
    ssl: random(lines).label,
    expiry: moment().add(item, 'days').format('MM/DD/YYYY'),
    status: random(statuses),
    truckers: ['default chip', 'default chip'],
  }))

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
    text: 'Truckers',
    value: 'truckers',
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
    label: 'Horizontal Column chart',
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
    label: 'Spline Area chart',
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

const onSelectRow = (e) => console.log(e)
</script>

<template>
  <ThemeSwitcher />
  <VContainer class="px-8" fluid>
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
            title:
              'Average dwell time (days) before empty containers are taken from the marketplace',
            increase: true,
            value: 7,
          }"
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol v-for="({ settings, data }, n) in charts" :key="n">
        <Chart
          :options="
            ({ colors, dark }) => ({
              chart: {
                type: settings.type,
                height: 280,
                background: colors.uiBackground,
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
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VirtualTable
          :headers="headers"
          :options="{
            rowHeight: 64,
            showActions,
            showSelect,
            tableHeight: 575,
            tableMinWidth: 960,
          }"
          :entities="entities"
          :loading="loading"
          @onSelectRow="onSelectRow"
          @onUpdated="() => {}"
        >
          <template #ref="{ item }">
            <Typography type="text-body-m-regular">{{ item.ref }}</Typography>
          </template>
          <template #label="{ item }">
            <Typography type="text-body-m-regular">{{ item.label }}</Typography>
          </template>
          <template #ssl="{ item }">
            <Typography
              type="text-body-m-regular text-truncate"
              :style="{ width: '5rem' }"
            >
              {{ item.ssl }}
              <Tooltip>
                {{ item.ssl }}
              </Tooltip>
            </Typography>
          </template>
          <template #expiry="{ item }">
            <Typography type="text-body-m-regular">{{
              item.expiry
            }}</Typography>
          </template>
          <template #status="{ item }">
            <Classification
              type="status"
              density="compact"
              :value="item.status"
            />
          </template>
          <template #truckers="{ item }">
            <Chip
              class="mr-1"
              v-for="trucker in item.truckers"
              :key="trucker"
              avatar
              size="small"
            >
              <Avatar start />
              {{ trucker }}
            </Chip>
            <Typography type="text-body-xs-semibold text-truncate"
              >+3 truckers</Typography
            >
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
                  :color="color"
                  :icon="icon"
                  :key="n"
                  @click="onAction(selected.length ? selected : [item], action)"
                >
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

<style scoped></style>
