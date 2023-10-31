<script setup>
import { Main } from '@layouts'

const tab = ref(0)
const tabs = [
  {
    label: 'Overall statistic',
  },
  {
    label: 'By truckers',
  },
  {
    label: 'By SLL',
  },
  {
    label: 'By yards',
  },
]
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
