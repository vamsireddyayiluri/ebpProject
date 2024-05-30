<script setup>
import { getColor } from '~/helpers/colors'
import { getBookingLoad } from '~/helpers/countings'
import { getTimeLine } from '~/helpers/filters'
import { statuses } from '~/constants/statuses'

const props = defineProps({
  booking: Object,
})
const emit = defineEmits(['close', 'goToBookingPage'])
const router = useRouter()
const selectedBooking = ref(false)
const goToBookingPage = () => {
  const query = [statuses.canceled, statuses.incomplete, statuses.expired, statuses.completed].includes(
    selectedBooking.value.status,
  )? { from: 'history' } : {}
  router.push({ path: `booking/${selectedBooking.value.id}`, query })
}
</script>

<template>
  <VRow
    no-gutters
    justify="space-between"
    align="center"
    class="mb-8"
  >
    <Typography
      type="text-h1"
      :color="getColor('textPrimary')"
    >
      Statistics
    </Typography>
    <IconButton
      icon="mdi-close"
      @click="emit('close')"
    />
  </VRow>
  <Divider class="-mx-7" />
  <div class="block md:flex gap-7 relative max-h-[70vh] overflow-y-auto overflow-x-auto scrollbar">
    <BookingsMapPopup
      :booking="booking"
      class="w-full md:w-50 pt-8 !px-0 pb-1 static md:sticky top-0 block md:flex justify-between flex-col bg-transparent"
    />
    <Divider
      vertical
      class="hidden md:block static md:sticky top-0"
    />
    <div
      class="w-full md:w-50 pt-8 pb-1 overflow-y-visible"
      :class="{ 'mb-10': selectedBooking }"
    >
      <template v-if="!selectedBooking">
        <Typography
          type="text-h3 mb-5"
          :color="getColor('textPrimary')"
        >
          Your bookings
        </Typography>
        <Typography
          v-if="!booking.entities.length"
          type="mb-5"
          :color="getColor('textSecondary')"
        >
          no bookings in this locations
        </Typography>
        <template
          v-for="i in booking.entities"
          :key="i.id"
        >
          <Card
            class="w-full mb-2 !p-4 !pt-3 elevation-0 rounded-lg group"
            :color="getColor('uiSecondary-01')"
          >
            <div class="flex justify-between items-center mb-2">
              <Typography>Booking ref# {{ i.ref }}</Typography>
              <div class="opacity-0 group-hover:opacity-100 transition">
                <Button
                  variant="plain"
                  density="compact"
                  @click="selectedBooking = i"
                >
                  see details
                </Button>
              </div>
            </div>
            <ProgressLinear :value="getBookingLoad(i.committed, i.containers)">
              {{ getBookingLoad(i.committed, i.containers) }}%
            </ProgressLinear>
          </Card>
        </template>
      </template>
      <div v-else>
        <Typography
          type="text-h3 mb-5"
          :color="getColor('textPrimary')"
        >
          Timeline
        </Typography>
        <Timeline
          :items="getTimeLine(selectedBooking?.timeLine)"
          variant="vertical"
          class="mb-10"
        />
        <div class="styledDrawerActions flex gap-6 pt-8">
          <Button @click="goToBookingPage"> Go to booking page</Button>
          <Button
            variant="plain"
            class="p-0"
            @click="selectedBooking = false"
          >
            Back to all bookings
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.styledDrawerActions {
  position: fixed;
  bottom: 25px;
  z-index: 2;
  background: linear-gradient(transparent, rgba(var(--v-theme-uiPrimary), 1));
}
</style>
