<script setup>
import { getColor } from '~/helpers/colors'
import { getLineAvatar } from '~/firebase/getLineAvatar'
import truckersData from '~/fixtures/statistics.json'

const statistics = ref(truckersData)
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Statistic by SSL
  </Typography>
  <div class="w-full flex flex-nowrap gap-5 overflow-x-auto pb-4 scrollbar">
    <template
      v-for="item in statistics.lines"
      :key="item.id"
    >
      <div
        class="w-[260px] p-4 rounded flex-shrink-0"
        :style="{ background: getColor('uiSecondary-01') }"
      >
        <LineAvatar
          :line="item"
          class="w-fit mx-auto mb-4"
        />
        <div class="flex justify-between gap-8">
          <div class="text-center">
            <Typography type="text-h1">
              46
            </Typography>
            <Typography
              type="text-body-s-regular"
              :color="getColor('textSecondary')"
            >
              joint bookings
            </Typography>
          </div>
          <div class="text-center">
            <Typography type="text-h1">
              3 <small class="text-sm">days</small>
            </Typography>
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
  <FulfillmentRateChart />
</template>
