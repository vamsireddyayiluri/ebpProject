<script setup>
import { getColor } from '~/helpers/colors'
import yardsData from '~/fixtures/yards.json'
import streetPlaceholder from '~/assets/images/street.png'
import streetPlaceholderDark from '~/assets/images/street-dark.png'
import { getYardBookingLoad } from '~/helpers/countings'
import imgPlaceholder from '~/assets/images/St by  yards.png'

const statistics = ref(yardsData)
const storage = useStorage('theme', '')
const bookingStatisticsDialog = ref(null)
const searchValue = ref(null)

const openStatisticsDialog = yard => {
  bookingStatisticsDialog.value.show(true)
  bookingStatisticsDialog.value.data = yard
}
const sortYards = e => {
  statistics.value.sort((a, b) => {
    return e.value !== 'toLessBookings'
      ? a.entities.length - b.entities.length
      : b.entities.length - a.entities.length
  })
}
const onClearSearch = () => {
  setTimeout(() => {
    statistics.value = yardsData
  }, 1000)
}
const debouncedSearch = useDebounceFn(searchValue => {
  if (!searchValue) {
    onClearSearch()
  } else {
    statistics.value = useArrayFilter(
      yardsData,
      ({ location: { address, label } }) =>
        useArraySome(
          useArrayMap(Object.values({ address, label }), value => String(value).toLowerCase())
            .value,
          values => values.includes(searchValue.toLowerCase()),
        ).value,
    ).value
  }
}, 300)

watch(searchValue, value => {
  debouncedSearch(value)
})
</script>

<template>
  <div class="flex justify-between gap-5 items-center flex-wrap md:!flex-nowrap mb-5">
    <Typography type="text-h1">
      Statistic by yards
    </Typography>
    <div class="w-fill sm:w-auto flex gap-5 ml-auto">
      <Sort
        size="48"
        icon-size="24"
        :items="[
          {
            label: 'From more to less bookings',
            value: 'toLessBookings',
          },
          {
            label: 'From less to more bookings',
            value: 'toMoreBookings',
          },
        ]"
        class="ml-auto"
        @onSelect="sortYards"
      />
      <Textfield
        v-model="searchValue"
        type="text"
        placeholder="Search states, cities, streets"
        prepend-inner-icon="mdi-magnify"
        clearable
        class="w-[270px]"
        @click:clear="onClearSearch"
      />
    </div>
  </div>
  <StatisticsPlaceholder
    v-if="statistics"
    :data="{ img: imgPlaceholder }"
  />
  <template v-else>
    <div class="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-5">
      <template
        v-for="item in statistics"
        :key="item.id"
      >
        <div
          class="p-4 rounded cursor-pointer"
          :style="{ background: getColor('uiSecondary-01') }"
          @click="openStatisticsDialog(item)"
        >
          <img
            :src="storage === 'light' ? streetPlaceholder : streetPlaceholderDark"
            alt="street map"
            class="w-fill h-[110px] rounded mb-4"
          >
          <Typography type="text-h4 truncate">
            <Highlighter
              v-if="searchValue"
              :query="searchValue"
            >
              {{ item.location.label || item.location.address }}
            </Highlighter>
            <template v-else>
              {{ item.location.label || item.location.address }}
            </template>
            <Tooltip>{{ item.location.address }}</Tooltip>
          </Typography>
          <div class="mt-2">
            <div class="flex justify-between mb-5">
              <Typography :color="getColor('textSecondary')">
                # of bookings
              </Typography>
              <Typography type="text-body-m-semibold">
                {{ item.entities.length }}
              </Typography>
            </div>
          </div>
          <ProgressLinear :value="getYardBookingLoad(item.entities).rate">
            {{ getYardBookingLoad(item.entities).rate }}%
          </ProgressLinear>
        </div>
      </template>
    </div>
  </template>
  <Dialog
    ref="bookingStatisticsDialog"
    class="max-w-[720px] md:max-w-[980px]"
  >
    <template #text>
      <BookingStatisticsDialog
        :booking="bookingStatisticsDialog.data"
        @close="bookingStatisticsDialog.show(false)"
      />
    </template>
  </Dialog>
</template>
