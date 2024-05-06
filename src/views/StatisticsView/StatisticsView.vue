<script setup>
import { Main } from '@layouts'
import { useStatisticsStore } from '../../stores/statistics.store'

const statisticsStore = useStatisticsStore()
const router = useRouter()
const tabs = [
  {
    label: 'Overall statistic',
    route: 'overallStatistic',
  },

  /*  {
    label: 'By truckers',
    route: 'byTruckers',
  },*/
  {
    label: 'By SSL',
    route: 'bySSL',
  },
  {
    label: 'By yards',
    route: 'byYards',
  },
]
const tab = ref(tabs.findIndex(i => i.route === router.currentRoute.value.query.tab))
const handleTabChange = async value => {
  await router.push({ query: { tab: tabs[value].route } })
}
onMounted(async () => {
  await statisticsStore.getBookingsQuery()
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
          @update:modelValue="handleTabChange"
        />
      </template>
    </SubHeader>
    <div class="h-full pt-10 px-8 pb-8">
      <template v-if="!tab">
        <OverallStatisticsTab />
      </template>
      <!--
        <template v-if="tab === 1">
        <StatisticsTruckersTab />
        </template>
      -->
      <template v-if="tab === 1">
        <StatisticsSSLTab />
      </template>
      <template v-if="tab === 2">
        <StatisticsYardsTab />
      </template>
    </div>
  </Main>
</template>
