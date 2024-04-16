<script setup>
import { getColor } from '~/helpers/colors'
import { useDate } from '~/composables'

const props = defineProps({
  data: Object,
})
const { getFormattedDate, getSmallerDate } = useDate()
const formatMinTime = dates => {
  const minData = getSmallerDate(dates)

  return getFormattedDate(minData)
}
</script>

<template>
  <div class="relative">
    <Typography type="text-body-m-regular">
      {{ formatMinTime(data.details) || '--' }}
    </Typography>
    <Typography
      v-if="data.details?.length > 1"
      type="text-body-xs-semibold absolute right-0 opacity-90"
      :color="getColor('textSecondary')"
    >
      +{{ data.details?.slice(1)?.length }} more
    </Typography>
    <Popover
      activator="parent"
      location="top center"
    >
      <div class="flex justify-center gap-2 py-1">
        <VTable>
          <thead>
            <tr>
              <th class="text-left">Committed/Total</th>
              <th class="text-left">Loading Date</th>
              <th class="text-left">SCAC</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="data in data.details"
              :key="data.loadingDate"
            >
              <td class="text-center">{{ data.committed }}/{{ data.containers }}</td>
              <td>{{ getFormattedDate(data.loadingDate) || '--' }}</td>
              <td>
                <div v-if="data.scacList?.list.length > 0">
                  <template
                    v-for="scac in data.scacList?.list"
                    :key="scac"
                  >
                    <Chip class="m-1">
                      {{ scac }}
                    </Chip>
                  </template>
                </div>
                <div v-else>
                  <span> -- </span>
                </div>
              </td>
            </tr>
          </tbody>
        </VTable>
      </div>
    </Popover>
  </div>
</template>

<style lang="scss">
.v-table {
  background-color: rgb(var(--v-theme-uiPrimary)) !important;
}
</style>
