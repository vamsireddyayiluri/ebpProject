<script setup>
import { getColor } from '~/helpers/colors'

const items = ['By years', 'By months']
const selected = ref(items[0])
const active = ref(2023)

const onUpdate = value => {
  value === 'By months' ? (active.value = 'September') : '2023'
}
</script>

<template>
  <div class="w-full">
    <div class="flex flex-wrap justify-between items-center gap-5 mt-10 mb-3">
      <Typography type="text-h2">
        Activity statistics
      </Typography>
      <div class="flex items-center ml-auto">
        <IconButton
          icon="mdi-chevron-left"
          size="24"
          variant="plain"
        />
        <IconButton
          icon="mdi-chevron-right"
          size="24"
          variant="plain"
        />
        <Typography
          :color="getColor('textSecondary')"
          class="ml-2 mr-8"
        >
          {{ active }}
        </Typography>
        <Select
          v-model="selected"
          label=""
          :items="items"
          class="max-w-[164px]"
          @update:modelValue="onUpdate"
        />
      </div>
    </div>
    <Chart
      :data="{
        series: [
          {
            name: 'bookings',
            data: [0, 0, 45, 32, 34, 52, 41, 68, 98, 100, 95, 87],
          },
        ],
      }"
      :options="
        () => ({
          chart: {
            type: 'area',
            zoom: {
              enabled: false,
            },
            width: '100%',
            height: 300,
            animations: {
              enabled: false,
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
            categories: [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ],
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
          },
          tooltip: {
            enabled: true,
            intersect: false,
          },
        })
      "
      class="w-[calc(100%+36px)] -ml-4"
    />
  </div>
</template>
