<script setup>
import truckersData from '~/fixtures/truckers.json'
import { useDisplay } from 'vuetify'
import { useHeaders } from '~/composables'
import { getColor } from '~/helpers/colors'

const { smAndDown } = useDisplay()
const { statisticsTruckersHeaders } = useHeaders()
const statistics = ref(truckersData)
const tableHeight = ref(0)

const tableId = 'statisticsBookingsTable'
onMounted(() => {
  setTimeout(() => {
    const table = document.getElementById(tableId)
    tableHeight.value = smAndDown.value
      ? 396
      : window.innerHeight - table.getBoundingClientRect().top - 95
  })
})
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Statistic by truckers
  </Typography>

  <VirtualTable
    :id="tableId"
    :key="tableId"
    :entities="statistics"
    :headers="statisticsTruckersHeaders"
    :options="{
      rowHeight: 64,
      showActions: false,
      tableHeight: tableHeight,
      tableMinWidth: 960,
    }"
    class="mb-5"
  >
    <template #trucker="{ item }">
      <div>
        <Typography>
          {{ item.scac }}
        </Typography>
        <Typography :color="getColor('textSecondary')">
          {{ item.email }}
        </Typography>
      </div>
    </template>
    <template #company="{ item }">
      <Typography>
        {{ item.company }}
      </Typography>
    </template>
    <template #takenBookings>
      <Typography> 12% </Typography>
    </template>
    <template #takenFulfilled>
      <Typography> 15 / 12 </Typography>
    </template>
    <template #ranging="{ item }">
      <div class="flex gap-1.5">
        <Icon
          icon="mdi-timer"
          variant="plain"
        />
        <Typography class="flex-shrink-0">
          3 days
        </Typography>
        <Tooltip :attach="!!item.index">
          Average fulfillment time
        </Tooltip>
      </div>
      <div class="flex gap-1.5 mx-2">
        <Icon icon="mdi-close-circle" />
        <Typography class="flex-shrink-0">
          25%
        </Typography>
        <Tooltip :attach="!!item.index">
          Cancellation rate
        </Tooltip>
      </div>
      <div class="flex gap-1.5">
        <Icon icon="mdi-timeline-check" />
        <Typography class="flex-shrink-0">
          20 min
        </Typography>
        <Tooltip :attach="!!item.index">
          Average acceptance time
        </Tooltip>
      </div>
    </template>
  </VirtualTable>
</template>
