<script setup>
import { getColor } from '~/helpers/colors'
import imgPlaceholder from '~/assets/images/St by ssl.png'
import { useStatisticsStore } from '~/stores/statistics.store'
import { storeToRefs } from 'pinia'

const statisticsStore = useStatisticsStore()
const { isLoading } = storeToRefs(statisticsStore)
const statistics = ref(null)

onMounted(async () => {
  statistics.value = await statisticsStore.statisticsBySSL()
  console.log('-> statistics.value', statistics.value)
})
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Statistic by SSL
  </Typography>
  <StatisticsPlaceholder
    v-if="!isLoading && !statistics"
    :data="{ img: imgPlaceholder }"
  />
  <template v-else>
    <div class="w-full flex flex-nowrap gap-5 overflow-x-auto pb-4 scrollbar">
      <ProgressLinear
        v-if="isLoading"
        indeterminate
      />
      <template
        v-for="item in statistics?.bySSL"
        :key="item.line.id"
      >
        <div
          class="w-[260px] p-4 rounded flex-shrink-0"
          :style="{ background: getColor('uiSecondary-01') }"
        >
          <LineAvatar
            :line="item.line"
            class="w-fit mx-auto mb-4"
          />
          <div class="flex justify-between gap-8">
            <div class="text-center">
              <Typography type="text-h1"> {{ item.jointBookings }}</Typography>
              <Typography
                type="text-body-s-regular"
                :color="getColor('textSecondary')"
              >
                joint bookings
              </Typography>
            </div>
            <div class="text-center">
              <Typography type="text-h1"> 3 <small class="text-sm">days</small></Typography>
              <Typography
                type="text-body-s-regular"
                :color="getColor('textSecondary')"
              >
                average fulfillment time
              </Typography>
            </div>
          </div>
        </div>
      </template>
    </div>
    <FulfillmentRateChart v-if="statistics?.fulfillmentRate" :data="statistics?.fulfillmentRate"/>
  </template>
</template>
