<script setup>
import { getColor } from '~/helpers/colors'
import { capitalize } from 'lodash'
import { getLineAvatar } from '~/firebase/getLineAvatar'
import { useBookingsStore } from '~/stores/bookings.store'
import { useDate } from '~/composables'

const props = defineProps({
  commitment: Object,
})
const emit = defineEmits(['close'])
const { bookings } = useBookingsStore()
const { getFormattedDate } = useDate()
const details = ref([
  { name: 'SCAC', value: 'ABCD' },
  { name: 'Chassis Type', value: 'Private' },
  { name: 'Company name', value: 'FedEx Freight' },
  { name: 'Email', value: 'fedex.freight@mail.com' },
  { name: 'Contact Name', value: 'Helga Corlovich' },
  { name: 'Cell Number', value: '0123456789' },
])
const openedPanel = ref([0])
const {
  ref: bookingRef,
  containers,
  committed,
  status,
  bookingExpiry,
  commodity,
  line,
  size,
  location,
  timeline,
} = bookings.find(i => i.id === props.commitment.bookingId)
const bookingObj = {
  ref: bookingRef,
  containers,
  committed,
  status,
  'loading date': getFormattedDate(bookingExpiry),
  commodity,
  line,
  size,
  'export facility': location,
}
const bookingDetails = Object.entries(bookingObj).map(([name, value]) => ({ name, value }))
</script>

<template>
  <div class="flex justify-between items-center mb-8 pt-2">
    <Typography type="text-h1">
      Commitment
    </Typography>
    <div
      class="ml-auto"
    >
      <IconButton
        icon="mdi-message-text"
        class="mr-2"
        @click="() => {}"
      >
        <Tooltip>
          Go go chat
        </Tooltip>
      </IconButton>
      <IconButton
        icon="mdi-close"
        size="24"
        width="32"
        min-width="32"
        height="32"
        @click="emit('close')"
      />
    </div>
  </div>
  <Divider class="w-[calc(100%+56px)] -ml-7" />
  <VRow
    no-gutters
    class="max-h-[70vh] static md:sticky top-0 px-1 overflow-auto scrollbar"
  >
    <VCol
      cols="12"
      md="7"
      class="mt-8 pr-0 md:!pr-8"
    >
      <Typography
        type="text-h4"
        class="mb-6"
      >
        Commitment details
      </Typography>
      <Card class="styleSection elevation-0 mb-1">
        <ExpansionPanels
          v-model="openedPanel"
          variant="accordion"
          multiple
        >
          <ExpansionPanel>
            <ExpansionPanelTitle>
              <Typography
                type="text-body-xs-regular"
                :color="getColor('textSecondary')"
              >
                Trucker details
              </Typography>
            </ExpansionPanelTitle>
            <ExpansionPanelText>
              <VRow class="mr-3">
                <VCol
                  v-for="({ name, value }, n) in details"
                  :key="n"
                  cols="6"
                >
                  <Typography
                    type="text-body-xs-regular"
                    :color="getColor('textSecondary')"
                  >
                    {{ name }}
                  </Typography>
                  <Typography
                    type="text-body-s-regular"
                    class="text-truncate"
                  >
                    {{ value }}
                  </Typography>
                </VCol>
              </VRow>
            </ExpansionPanelText>
          </ExpansionPanel>
          <ExpansionPanel v-if="openedPanel.includes(0)">
            <ExpansionPanelTitle>
              <Typography
                type="text-body-xs-regular"
                :color="getColor('textSecondary')"
              >
                Booking details
              </Typography>
            </ExpansionPanelTitle>
            <ExpansionPanelText class="pa-0">
              <VRow
                v-for="({ name, value }, n) in bookingDetails"
                :key="n"
                no-gutters
                justify="space-between"
                class="py-1.5 mb-3 last:!mb-0"
              >
                <Typography type="text-body-s-regular">
                  {{ capitalize(name) }}
                </Typography>
                <template v-if="name === 'status'">
                  <Classification
                    type="status"
                    :value="value"
                    class="-my-2"
                  />
                </template>
                <template v-else-if="name === 'line'">
                  <img
                    :src="getLineAvatar(value.id)"
                    :alt="value.label"
                    class="h-8"
                  >
                </template>
                <template v-else-if="name === 'export facility'">
                  <Typography
                    type="text-body-s-regular ml-1"
                    :color="getColor('textSecondary')"
                  >
                    {{ value.address }}
                  </Typography>
                </template>
                <template v-else>
                  <Typography
                    type="text-body-s-regular ml-1"
                    :color="getColor('textSecondary')"
                  >
                    {{ value }}
                  </Typography>
                </template>
              </VRow>
            </ExpansionPanelText>
          </ExpansionPanel>
        </ExpansionPanels>
      </Card>
    </VCol>
    <Divider
      vertical
      class="hidden md:block"
    />
    <VCol
      cols="12"
      md="5"
      class="pt-8 pl-1 md:!pl-8"
    >
      <Typography
        type="text-h4"
        class="mb-6"
      >
        Timeline
      </Typography>
      <Timeline
        :items="timeline"
        variant="vertical"
        class="scrollbar overflow-auto"
      />
    </VCol>
  </VRow>
</template>

<style lang="scss">
.styleSection {
  .styledVExpansionPanels {
    .v-expansion-panel-title {
      background: rgba(var(--v-theme-uiSecondary-02), 1);
    }

    .v-expansion-panel-text {
      background: rgba(var(--v-theme-uiSecondary-02), 1);

      .v-expansion-panel-text__wrapper {
        padding: 0 24px 12px;
        margin-top: -4px;
      }
    }

    .v-expansion-panel__shadow {
      box-shadow: none !important;
    }

    .v-expansion-panel-title--active {
      &:hover {
        .v-expansion-panel-title__overlay {
          opacity: 0;
        }
      }
    }
  }
}
</style>
