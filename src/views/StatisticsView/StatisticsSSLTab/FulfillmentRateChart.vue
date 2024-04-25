<script setup>
const props = defineProps({
  data: Object,
})
</script>

<template>
  <Typography type="text-h2 mt-10 mb-6">
    Fulfillment rate
  </Typography>

  <Chart
    :options="
      ({ colors, dark }) => ({
        chart: {
          type: 'bar',
          height: 280,
          background: colors.uiBackground,
          animations: {
            enabled: false,
          },
          toolbar: { show: false },
        },
        colors: [colors.uiChart],
        states: {
          hover: {
            filter: {
              type: 'darken',
              value: 0.65,
            },
          },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 4,
            startingShape: 'rounded',
            endingShape: 'rounded',
            distributed: false,
            colors: {
              backgroundBarColors: ['transparent'],
              backgroundBarOpacity: 0,
              backgroundBarRadius: 4,
            },
          },
        },
        legend: { show: false },
        dataLabels: {
          enabled: true,
          formatter: n => `${n} containers`,
        },
        grid: {
          show: true,
          borderColor: colors.uiLine,
        },
        xaxis: {
          show: true,
          categories: data.categories,
          labels: {
            show: true,
            style: {
              colors: colors.textSecondary,
            },
          },
          axisBorder: { show: false, color: colors.uiLine },
          axisTicks: { show: false },
        },
        yaxis: {
          show: false,
        },
        tooltip: {
          enabled: true,
          intersect: false,
          theme: dark,
        },
      })
    "
    :data="data"
    class="w-[calc(100%+18px)] -mt-4 -mx-2.5"
  />
</template>
