<script setup>
import { getColor } from '~/helpers/colors'
import { useBookingsStore } from '~/stores/bookings.store'
import { useDate } from '~/composables'
import { statuses } from '~/constants/statuses'
import { useChatStore } from '~/stores/chat.store'
import { useTruckerManagementStore } from '~/stores/truckerManagement.store'
import saferLink from '~/fixtures/safer-link'
import { useCommitmentsStore } from '~/stores/commitments.store'
import { getTimeLine } from '~/helpers/filters'

const props = defineProps({
  commitment: Object,
})
const emit = defineEmits(['close', 'approveCommitment', 'completeCommitment', 'declineCommitment'])
const bookingStore = useBookingsStore()
const { getCommitment } = useCommitmentsStore()
const { getTruckerDetails } = useTruckerManagementStore()
const { getFormattedDate } = useDate()
const { goToChat } = useChatStore()
const router = useRouter()
const currentCommitment = ref(null)
const orgDetails = ref(null)
const booking = ref(null)
const isPending = props.commitment?.status === statuses.pending
const openedPanel = ref([0])
const status = ref(null)

const { truckerDetails } = props.commitment.details
let details = ref([
  { name: 'Company name', value: props.commitment?.truckerCompany },
  { name: 'SCAC', value: truckerDetails?.truckerScac },
  { name: 'Safer link', value: null },
  { name: 'Number of trucks', value: truckerDetails?.numberOfTrucks },
  { name: 'Insurance amount', value: truckerDetails?.insuranceCoverage },
  {
    name: 'Authorized for Overweight',
    value: truckerDetails?.weightAuthorization === 'Overweight' ? 'Yes' : 'No',
  },
])

onMounted(async () => {
  currentCommitment.value = await getCommitment(props.commitment.id)
  orgDetails.value = await getTruckerDetails(props.commitment.truckerOrgId)
  status.value = bookingStore?.allBookings.find(i => i.id === props.commitment.bookingId).status
  details.value = [
    ...details.value,
    ...[
      { name: 'Email', value: props.commitment?.truckerEmail },
      { name: 'Name', value: orgDetails.value?.vendorDetails?.primaryContactName },
      { name: 'Contact number', value: orgDetails.value?.vendorDetails?.primaryContact },
      { name: 'Secondary name', value: orgDetails.value?.vendorDetails?.secondaryContactName },
      { name: 'Secondary number', value: orgDetails.value?.vendorDetails?.secondaryContact },
    ],
  ]
})
onUnmounted(() => {
  router.push({ query: null })
})
</script>

<template>
  <div class="flex justify-between items-center mb-8 pt-2">
    <Typography type="text-h1">
      Commitment
    </Typography>
    <div class="ml-auto">
      <Button
        prepend-icon="mdi-message-text"
        density="compact"
        class="mr-4"
        @click="goToChat(currentCommitment.truckerOrgId)"
      >
        Chat with trucker
      </Button>
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
                  <template v-if="name === 'Safer link'">
                    <a
                      :href="saferLink + truckerDetails?.mcNumber"
                      target="_blank"
                      style="color: blue"
                      class="text-decoration-none"
                    >
                      {{ truckerDetails?.mcNumber }}
                    </a>
                  </template>
                  <template v-else>
                    <FlexTypography
                      type="text-body-s-regular"
                      class="text-truncate"
                    >
                      {{ value || '--' }}
                    </FlexTypography>
                  </template>
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
                <Typography type="text-body-s-regular">
                  Ref
                </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ currentCommitment.ref }}
                </Typography>
                <Typography type="text-body-s-regular">
                  Containers
                </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ currentCommitment.containers }}
                </Typography>
                <Typography type="text-body-s-regular">
                  Committed
                </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ currentCommitment.committed }}
                </Typography>
                <Typography type="text-body-s-regular">
                  Target Rate
                </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ currentCommitment.estimatedRate }}
                </Typography>
                <Typography
                  v-if="currentCommitment?.onBoardedContainers"
                  type="text-body-s-regular"
                >
                  OnBoarded Containers
                </Typography>
                <Typography
                  v-if="currentCommitment?.onBoardedContainers"
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ currentCommitment?.onBoardedContainers || '' }}
                </Typography>
                <Typography type="text-body-s-regular">
                  Status
                </Typography>
                <Classification
                  type="status"
                  :value="status.replace('_', ' ')"
                  class="w-min h-fit ml-auto"
                />
                <template
                  v-if="
                    currentCommitment.reason &&
                      (status === statuses.canceled ||
                        status === statuses.declined ||
                        status === statuses.bookingCanceled)
                  "
                >
                  <Typography type="text-body-s-regular">
                    Reason
                  </Typography>
                  <Typography
                    type="text-body-s-regular text-end"
                    :color="getColor('textSecondary')"
                  >
                    {{ currentCommitment.reason }}
                  </Typography>
                </template>
                <Typography type="text-body-s-regular">
                  Loading date
                </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ getFormattedDate(currentCommitment.loadingDate) }}
                </Typography>
                <Typography type="text-body-s-regular">
                  Commodity
                </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ currentCommitment.commodity }}
                </Typography>
                <Typography type="text-body-s-regular">
                  Line
                </Typography>
                <LineAvatar
                  :line="currentCommitment.line"
                  class="ml-auto"
                />
                <Typography type="text-body-s-regular">
                  Size
                </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  <template v-if="currentCommitment.flexibleBooking">
                    {{ currentCommitment.size.join(', ') }}
                  </template>
                  <template v-else>
                    {{ currentCommitment.size }}
                  </template>
                </Typography>
                <Typography type="text-body-s-regular">
                  Export facility
                </Typography>
                <Typography
                  type="text-body-s-regular text-end"
                  :color="getColor('textSecondary')"
                >
                  {{ currentCommitment.location.address }}
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
      v-if="currentCommitment"
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
        :items="getTimeLine(currentCommitment.timeLine)"
        variant="vertical"
        class="scrollbar overflow-auto md:mb-10"
      />
      <div class="styledCommitActionsBtns static md:fixed bottom-8 flex pt-8 gap-4">
        <Button
          v-if="currentCommitment.status === statuses.approved && status !== statuses.paused"
          @click="emit('completeCommitment', currentCommitment)"
        >
          complete
        </Button>
        <template v-if="isPending && status !== statuses.paused">
          <Button @click="emit('approveCommitment', currentCommitment)">
            approve
          </Button>
          <Button
            variant="outlined"
            data="secondary1"
            :style="{ background: 'rgba(var(--v-theme-uiPrimary), 1)' }"
            @click="emit('declineCommitment', currentCommitment)"
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
  z-index: 10;
}
</style>
