<script setup>
import { getColor } from '~/helpers/colors'
import { getLineAvatar } from '~/firebase/getLineAvatar'
import { useBookingsStore } from '~/stores/bookings.store'
import { useDate } from '~/composables'
import { statuses } from '~/constants/statuses'
import { useChatStore } from '~/stores/chat.store'

const props = defineProps({
  commitment: Object,
})
const emit = defineEmits(['close', 'approveCommitment', 'completeCommitment', 'declineCommitment'])
const bookingStore = useBookingsStore()
const { getFormattedDate } = useDate()
const { goToChat } = useChatStore()
const checkCommitmentStatus = () => {
  return props.commitment?.timeline?.some(({ title }) => title.includes('approved'))
}
const isPending = props.commitment?.status === statuses.pending
const details = ref([
  { name: 'Company name', value: 'FedEx Freight' },
  { name: 'SCAC', value: 'ABCD' },
  { name: 'Email', value: 'fedex.freight@mail.com' },
  { name: 'Safer link', value: '2' },
  { name: 'Number of truckers', value: '20' },
  { name: 'Insurance amount', value: '250.000-500.000' },
  { name: 'Authorized for Overweight', value: 'No' },
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
} = bookingStore.bookings.find(i => i.id === props.commitment.bookingId)

onMounted(async () => {
  if (checkCommitmentStatus()) {
    details = [
      details,
      ...[
        { name: 'Email', value: 'fedex.freight@mail.com' },
        { name: 'Name', value: 'Vitaliy' },
        { name: 'Contact number', value: '0123456789' },
        { name: 'Secondary name', value: '0123456789' },
        { name: 'Secondary number', value: '--' },
      ],
    ]
    // details.value.push({ name: 'Email', value: 'fedex.freight@mail.com' })
    // details.value.push({ name: 'Name', value: 'Vitaliy' })
    // details.value.push({ name: 'Contact number', value: '0123456789' })
    // details.value.push({ name: 'Secondary name', value: '0123456789' })
    // details.value.push({ name: 'Secondary number', value: '--' })
  }
})
</script>

<template>
  <div class="flex justify-between items-center mb-8 pt-2">
    <Typography type="text-h1"> Commitment </Typography>
    <div class="ml-auto">
      <IconButton
        icon="mdi-message-text"
        class="mr-2"
        @click="goToChat('6srEzErbjIW4bL9gQUNbI51BGlE3')"
      >
        <Tooltip> Go to chat </Tooltip>
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
      class="mt-8 pr-0 md:!pr-8 mb-2"
    >
      <Typography
        type="text-h4"
        class="mb-6"
      >
        Commitment details
      </Typography>
      <Card class="styleSection elevation-0">
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
          <ExpansionPanel>
            <ExpansionPanelTitle>
              <Typography
                type="text-body-xs-regular"
                :color="getColor('textSecondary')"
              >
                Booking details
              </Typography>
            </ExpansionPanelTitle>
            <ExpansionPanelText class="pa-0">
              <div class="grid grid-cols-2 items-center [&>div]:py-2.5">
                <Typography type="text-body-s-regular"> Ref </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ bookingRef }}
                </Typography>
                <Typography type="text-body-s-regular"> Containers </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ containers }}
                </Typography>
                <Typography type="text-body-s-regular"> Committed </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ committed }}
                </Typography>
                <Typography type="text-body-s-regular"> Status </Typography>
                <Classification
                  type="status"
                  :value="commitment.status"
                  class="w-min h-fit ml-auto"
                />
                <template
                  v-if="
                    commitment.status === statuses.declined ||
                    commitment.status === statuses.incomplete
                  "
                >
                  <Typography type="text-body-s-regular"> Reason </Typography>
                  <Typography
                    type="text-body-s-regular text-end"
                    :color="getColor('textSecondary')"
                  >
                    {{ commitment.reason }}
                  </Typography>
                </template>
                <Typography type="text-body-s-regular"> Loading date </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ getFormattedDate(bookingExpiry) }}
                </Typography>
                <Typography type="text-body-s-regular"> Commodity </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ commodity }}
                </Typography>
                <Typography type="text-body-s-regular"> Line </Typography>
                <img
                  :src="getLineAvatar(line.id)"
                  :alt="line.label"
                  class="h-8 ml-auto"
                />
                <Typography type="text-body-s-regular"> Size </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ size }}
                </Typography>
                <Typography type="text-body-s-regular"> Export facility </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ location.address }}
                </Typography>
              </div>
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
      class="relative pt-8 pl-1 md:!pl-8"
    >
      <Typography
        type="text-h4"
        class="mb-6"
      >
        Timeline
      </Typography>
      <Timeline
        :items="commitment.timeline"
        variant="vertical"
        class="scrollbar overflow-auto md:mb-10"
      />
      <div class="styledCommitActionsBtns static md:fixed bottom-8 flex pt-8 gap-4">
        <Button
          v-if="commitment.status === statuses.approved && status !== statuses.paused"
          @click="emit('completeCommitment', commitment.id)"
        >
          complete
        </Button>
        <template v-if="isPending && status !== statuses.paused">
          <Button @click="emit('approveCommitment', commitment)"> approve </Button>
          <Button
            variant="outlined"
            data="secondary1"
            :style="{ background: 'rgba(var(--v-theme-uiPrimary), 1)' }"
            @click="emit('declineCommitment', commitment.id)"
          >
            decline
          </Button>
        </template>
      </div>
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
.styledCommitActionsBtns {
  background: linear-gradient(transparent, rgba(var(--v-theme-uiPrimary), 1));
}
</style>
