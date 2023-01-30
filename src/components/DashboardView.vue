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
  <VContainer fluid>
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
      <VCol></VCol>
      <VCol></VCol>
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
