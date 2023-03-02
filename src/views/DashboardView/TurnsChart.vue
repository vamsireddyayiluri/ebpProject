<script setup>
import { getColor } from '~/helpers/colors'

const props = defineProps({
  charts: {
    type: Object,
    required: true,
  },
})

const { charts } = toRefs(props)

const turnsDialog = ref(false)
</script>

<template>
  <VHover v-slot="{ isHovering, props }">
    <Card
      elevation="0"
      :color="getColor('uiSecondary-01')"
      v-bind="{ ...props }"
      class="fill-height pa-6 position-relative"
    >
      <Typography type="text-h4">
        {{ charts.label }}
      </Typography>
      <div
        v-if="isHovering"
        class="card-controls"
      >
        <IconButton
          class="border"
          icon="mdi-download"
          size="20"
          width="32"
          min-width="32"
          height="32"
          variant="plain"
        >
          <Tooltip location="top">
            Download PDF
          </Tooltip>
        </IconButton>
        <IconButton
          class="no-hover border ml-3"
          icon="mdi-arrow-top-right-bottom-left"
          size="20"
          width="32"
          min-width="32"
          height="32"
          variant="plain"
          @click="turnsDialog.show(true)"
        >
          <Tooltip location="top">
            Open in full
          </Tooltip>
        </IconButton>
      </div>
      <Chart
        :options="
          ({ colors, dark }) => ({
            chart: {
              type: charts.settings.type,
              height: 280,
              animations: {
                enabled: false,
              },
              toolbar: { show: false },
            },
            colors: [colors.uiChart],
            plotOptions: {
              bar: {
                horizontal: charts.settings.horizontal,
                ...(charts.settings.horizontal && { barHeight: '20%' }),
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
              enabled: charts.settings.showLabels,
              formatter: n => `${n}%`,
            },
            grid: {
              show: true,
              borderColor: colors.uiLine,
            },
            xaxis: {
              show: true,
              categories: charts.data.categories,
              labels: {
                show: true,
                style: {
                  colors: colors.textSecondary,
                },
              },
              axisBorder: { show: true, color: colors.uiLine },
              axisTicks: { show: true },
            },
            yaxis: {
              show: true,
              labels: {
                show: true,
                style: {
                  colors: colors.textSecondary,
                },
              },
              axisBorder: { show: true, color: colors.uiLine },
            },
            tooltip: {
              enabled: true,
              intersect: false,
              theme: dark,
            },
          })
        "
        :data="charts.data"
      />
    </Card>
  </VHover>
  <Dialog
    ref="turnsDialog"
    width="50%"
    min-width="400px"
  >
    <template #text>
      <div class="pa-0">
        <VRow
          no-gutters
          align="baseline"
          justify="space-between"
        >
          <Typography type="text-h3">
            Turns by market
          </Typography>
          <IconButton
            icon="mdi-download"
            size="20"
            width="32"
            min-width="32"
            height="32"
            variant="plain"
          >
            <Tooltip location="top">
              Download PDF
            </Tooltip>
          </IconButton>
        </VRow>

        <Chart
          :options="
            ({ colors, dark }) => ({
              chart: {
                type: charts.settings.type,
                height: 280,
                animations: {
                  enabled: false,
                },
                toolbar: { show: false },
              },
              colors: [colors.uiChart],
              plotOptions: {
                bar: {
                  horizontal: charts.settings.horizontal,
                  ...(charts.settings.horizontal && { barHeight: '20%' }),
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
                enabled: charts.settings.showLabels,
                formatter: n => `${n}%`,
              },
              grid: {
                show: true,
                borderColor: colors.uiLine,
              },
              xaxis: {
                show: true,
                categories: charts.data.categories,
                labels: {
                  show: true,
                  style: {
                    colors: colors.textSecondary,
                  },
                },
                axisBorder: { show: true, color: colors.uiLine },
                axisTicks: { show: true },
              },
              yaxis: {
                show: true,
                labels: {
                  show: true,
                  style: {
                    colors: colors.textSecondary,
                  },
                },
                axisBorder: { show: true, color: colors.uiLine },
              },
              tooltip: {
                enabled: true,
                intersect: false,
                theme: dark,
              },
            })
          "
          :data="charts.data"
        />
      </div>
    </template>
  </Dialog>
</template>

<style lang="scss" scoped>
.styledVCard {
  &:hover {
    &.v-theme--light {
      box-shadow: 1px 0px 3px rgba(42, 48, 56, 0.1), 0px 2px 5px rgba(42, 48, 56, 0.15) !important;
    }
    &.v-theme--dark {
      box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.4) !important;
    }
  }
}
.card-controls {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 2;
}
</style>
