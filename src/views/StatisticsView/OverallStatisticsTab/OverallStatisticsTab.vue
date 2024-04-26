<script setup>
import overallSTPlaceholder from '~/assets/images/overallSt2.png'
import { useStatisticsStore } from '~/stores/statistics.store'
import { storeToRefs } from 'pinia'

const statistics = ref(null)
const statisticsStore = useStatisticsStore()
const { isLoading } = storeToRefs(statisticsStore)

onMounted(async () => {
  statistics.value = await statisticsStore.statisticsOverall()
})
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Overall statistics
  </Typography>

  <StatisticsPlaceholder
    v-if="!statistics && !isLoading"
    :data="{ img: overallSTPlaceholder }"
  />
  <template v-else>
    <div class="[&>div]:w-full flex flex-wrap md:!flex-nowrap gap-5 mb-10">
      <AverageCard
        title="Total number of bookings"
        message="this month"
        :loading="isLoading"
        :sum="statistics?.totalNumberOfBookings"
        :increase="+statistics?.bookingsMonthVolatility >= 0"
        :value="statistics?.bookingsMonthVolatility[0].change"
      />
      <AverageCard
        title="Total canceled bookings"
        message="this month"
        :loading="isLoading"
        :sum="statistics?.totalCanceled"
        :increase="+statistics?.canceledBookingsMonthVolatility.at(-1)?.change >= 0"
        :value="statistics?.canceledBookingsMonthVolatility.at(-1)?.change || 0"
      />
      <AverageCard
        title="Successfully done"
        message="this month"
        :loading="isLoading"
        :sum="statistics?.successfullyBookings"
        :increase="+statistics?.successfullyBookingsMonthVolatility.at(-1)?.change >= 0"
        :value="statistics?.successfullyBookingsMonthVolatility.at(-1)?.change || 0"
      />
    </div>
    <ActivityStatisticsChart />
  </template>
</template>
