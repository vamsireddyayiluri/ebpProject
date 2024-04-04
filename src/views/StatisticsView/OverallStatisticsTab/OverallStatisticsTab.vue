<script setup>
import statisticsData from '~/fixtures/statistics.json'
import overallSTPlaceholder from '~/assets/images/overallSt2.png'

const statistics = ref(statisticsData)
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Overall statistics
  </Typography>

  <StatisticsPlaceholder v-if="statistics" :data="{img: overallSTPlaceholder}"/>
  <template v-else>
    <div class="[&>div]:w-full flex flex-wrap md:!flex-nowrap gap-5 mb-10">
      <AverageCard
        title="Total number of bookings"
        message="this month"
        :sum="statistics.totalNumberOfBookings"
        :increase="+statistics.bookingsMonthVolatility >= 0"
        :value="statistics.bookingsMonthVolatility"
      />
      <AverageCard
        title="Removed from the network"
        message="this month"
        :sum="statistics.removedBookings"
        :increase="+statistics.removedBookingsMonthVolatility >= 0"
        :value="statistics.removedBookingsMonthVolatility"
      />
      <AverageCard
        title="Successfully done"
        message="this month"
        :sum="statistics.successfullyBookings"
        :increase="+statistics.successfullyBookingsMonthVolatility >= 0"
        :value="statistics.successfullyBookingsMonthVolatility"
      />
    </div>
    <ActivityStatisticsChart/>
  </template>
</template>
