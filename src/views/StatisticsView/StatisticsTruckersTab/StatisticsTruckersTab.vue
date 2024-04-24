<script setup>
import truckersData from '~/fixtures/truckers.json'
import { useDisplay } from 'vuetify'
import { useHeaders } from '~/composables'
import { getColor } from '~/helpers/colors'
import imgPlaceholder from '~/assets/images/St by trucker.png'
import { useStatisticsStore } from '~/stores/statistics.store'
import { storeToRefs } from 'pinia'

const statisticsStore = useStatisticsStore()
const { isLoading } = storeToRefs(statisticsStore)
const { smAndDown } = useDisplay()
const { statisticsTruckersHeaders } = useHeaders()
const statistics = ref([])
const tableHeight = ref(0)

onMounted(async () => {
  statistics.value = await statisticsStore.statisticsByTrucker()
  console.log('-> statistics.value', statistics.value)
})
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
  <StatisticsPlaceholder
    v-if="!isLoading && !statistics.length"
    :data="{ img: imgPlaceholder }"
  />
  <template v-else>
    <VirtualTable
      :id="tableId"
      :key="tableId"
      :entities="statistics"
      :headers="statisticsTruckersHeaders"
      :loading="isLoading"
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
      <template #takenBookings="{ item }">
        <Typography> {{`${Math.round(item.committedFulfilled / item.committedBookings * 10000) /100}%`}}</Typography>
      </template>
      <template #takenOnboarded="{ item }">
        <Typography> {{`${item.committedBookings}/${item.committedFulfilled}`}} </Typography>
      </template>
      <template #performance>
        <div class="flex gap-1.5">
          <Icon
            icon="mdi-timer"
            variant="plain"
          />
          <Typography class="flex-shrink-0"> 3 days</Typography>
          <Tooltip> Average fulfillment time</Tooltip>
        </div>
        <div class="flex gap-1.5 mx-2">
          <Icon icon="mdi-close-circle" />
          <Typography class="flex-shrink-0"> 25%</Typography>
          <Tooltip> Cancellation rate</Tooltip>
        </div>
        <div class="flex gap-1.5">
          <Icon icon="mdi-timeline-check" />
          <Typography class="flex-shrink-0"> 20 min</Typography>
          <Tooltip> Average acceptance time</Tooltip>
        </div>
      </template>
    </VirtualTable>
  </template>
</template>
