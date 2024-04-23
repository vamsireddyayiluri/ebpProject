<script setup>
import { Main } from '@layouts'
import { useStatisticsStore } from '../../stores/statistics.store'

const statisticsStore = useStatisticsStore()

const tab = ref(0)
const tabs = [
  {
    label: 'Overall statistic',
  },
  {
    label: 'By truckers',
  },
  {
    label: 'By SSL',
  },
  {
    label: 'By yards',
  },
]

onMounted(async () => {
  const overallStatistics = await statisticsStore.statisticsOverall()

  console.log(overallStatistics)

  debugger
})
</script>

<template>
  <Main>
    <SubHeader
      show-arrows
      sticky
      class="top-16 z-10"
    >
      <template #controls="props">
        <Tabs
          v-model="tab"
          :items="tabs"
          v-bind="props"
        />
      </template>
    </SubHeader>
    <div class="h-full pt-10 px-8 pb-8">
      <template v-if="!tab">
        <OverallStatisticsTab />
      </template>
      <template v-if="tab === 1">
        <StatisticsTruckersTab />
      </template>
      <template v-if="tab === 2">
        <StatisticsSSLTab />
      </template>
      <template v-if="tab === 3">
        <StatisticsYardsTab />
      </template>
    </div>
  </Main>
</template>
