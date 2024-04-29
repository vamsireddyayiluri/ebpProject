<script setup>
import { getColor } from '~/helpers/colors'
import moment from 'moment'
import { useStatisticsStore } from '~/stores/statistics.store'

const statistics = ref([
  {
    name: 'bookings',
    data: [],
  },
])
const categories = ref([])
const statisticsStore = useStatisticsStore()
const items = ['By years', 'By months']
const selected = ref(items[0])
const currentYear = ref(moment().year())
const currentMonth = ref(moment().format('MMM'))
const xAxisOpacity = ref(1)

const changePeriod = async () => {
  currentYear.value = moment().year()
  currentMonth.value = moment().format('MMM')
  xAxisOpacity.value = 0
  setTimeout(() => {
    xAxisOpacity.value = 1
  }, 600)
}
const goToPrevious = async () => {
  if (selected.value === 'By years') {
    currentYear.value--
  } else {
    const currentMonthIndex = moment(currentMonth.value, 'MMM').month()
    if (currentMonthIndex === 0) {
      currentYear.value--
      currentMonth.value = moment().month(11).format('MMM')
    } else {
      currentMonth.value = moment()
        .month(currentMonthIndex - 1)
        .format('MMM')
    }
  }
}
const goToNext = async () => {
  if (selected.value === 'By years') {
    currentYear.value++
  } else {
    const currentMonthIndex = moment(currentMonth.value, 'MMM').month()
    if (currentMonthIndex === 11) {
      currentYear.value++
      currentMonth.value = moment().month(0).format('MMM')
    } else {
      currentMonth.value = moment()
        .month(currentMonthIndex + 1)
        .format('MMM')
    }
  }
}
onMounted(async () => {
  const data = await statisticsStore.activityStatistic({
    year: currentYear.value,
    month: selected.value === 'By months' ? currentMonth.value : null,
  })
  statistics.value[0].data = data.series
  categories.value = data.categories
})

watch([currentYear, currentMonth, selected], async () => {
  const data = await statisticsStore.activityStatistic({
    year: currentYear.value,
    month: selected.value === 'By months' ? currentMonth.value : null,
  })
  setTimeout(() => {
    categories.value = data.categories
  }, 500)
  statistics.value[0].data = data.series
})
</script>

<template>
  <div class="w-full">
    <div class="flex flex-wrap justify-between items-center gap-5 mt-10 mb-3">
      <Typography type="text-h2"> Activity statistics</Typography>
      <div class="flex items-center ml-auto">
        <IconButton
          icon="mdi-chevron-left"
          size="24"
          variant="plain"
          @click="goToPrevious"
        />
        <IconButton
          icon="mdi-chevron-right"
          size="24"
          variant="plain"
          @click="goToNext"
        />
        <Typography
          :color="getColor('textSecondary')"
          class="ml-2 mr-8"
        >
          {{ selected === 'By months' ? currentYear + ' - ' + currentMonth : currentYear }}
        </Typography>
        <Select
          v-model="selected"
          label=""
          :items="items"
          class="max-w-[164px]"
          @update:modelValue="changePeriod"
        />
      </div>
    </div>
    <Chart
      v-if="statistics && categories.length"
      :data="{
        series: statistics,
      }"
      :options="
        ({dark}) => ({
          chart: {
            type: 'area',
            zoom: {
              enabled: false,
            },
            width: '100%',
            height: 300,
            animations: {
              enabled: true,
            },
            toolbar: {
              show: false,
            },
          },
          colors: [getColor('functionalGraph-1'), getColor('uiInteractive')],
          stroke: {
            width: 1,
          },
          legend: {
            show: false,
          },
          plotOptions: {},
          dataLabels: {
            enabled: false,
          },
          grid: {
            show: true,
            borderColor: getColor('uiLine'),
          },
          xaxis: {
            show: true,
            labels: {
              show: true,
              style: {
                colors: getColor('textSecondary'),
              },
            },
            axisBorder: { show: false, color: getColor('uiLine') },
            axisTicks: { show: false },
            categories,
          },
          yaxis: {
            show: true,
            labels: {
              show: true,
              style: {
                colors: getColor('textSecondary'),
              },
            },
            axisBorder: { show: true, color: getColor('uiLine') },
            tickAmount: 1,
          },
          tooltip: {
            enabled: true,
            intersect: false,
            theme: dark,
          },
        })
      "
      class="w-[calc(100%+36px)] -ml-4"
    />
  </div>
</template>

<style lang="scss">
.apexcharts-xaxis {
  opacity: v-bind(xAxisOpacity);
}
</style>
