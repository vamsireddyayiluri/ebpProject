<script setup>
import { getColor } from '~/helpers/colors'
import { getYardBookingLoad } from '~/helpers/countings'

const props = defineProps({
  booking: Object,
})
const attrs = useAttrs()
</script>

<template>
  <div
    class="w-[316px] py-6 px-7 rounded-md"
    v-bind="{...attrs}"
    :style="{background: getColor('uiPrimary')}"
  >
    <div class="flex justify-between gap-4">
      <Typography type="text-h3">
        {{ booking.location.address }}
      </Typography>
      <IconButton
        icon="mdi-link"
        size="18"
        variant="plain"
        :color="getColor('iconButton-1')"
      />
    </div>
    <ProgressCircular
      :size="260"
      :value="getYardBookingLoad(booking.entities).rate"
      text="fullfilled"
      class="flex mx-auto"
    >
      {{ getYardBookingLoad(booking.entities).rate }}%
    </ProgressCircular>
    <div class="flex justify-between flex-wrap">
      <Typography type="text-body-m-semibold mb-3">
        You have {{ getYardBookingLoad(booking.entities).containers }} bookings
      </Typography>
      <div>
        <div class="flex items-center gap-3">
          <div
            class="dot"
            :style="{background: getColor('uiLineInteractiveActive')}"
          />
          <Typography type="text-body-m-semibold">
            {{ getYardBookingLoad(booking.entities).rate }}%
          </Typography>
          <Typography :color="getColor('textSecondary')">
            fullfilled
          </Typography>
        </div>
        <div class="flex items-center gap-3 mt-1">
          <div
            class="dot"
            :style="{background: getColor('uiLine')}"
          />
          <Typography type="text-body-m-semibold">
            {{ (100 - getYardBookingLoad(booking.entities).rate).toFixed(2) }}%
          </Typography>
          <Typography :color="getColor('textSecondary')">
            not fullfilled
          </Typography>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
