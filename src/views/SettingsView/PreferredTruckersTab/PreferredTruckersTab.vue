<script setup>
import { getColor } from '~/helpers/colors'
import { useDisplay } from 'vuetify'
import { useActions, useDate, useHeaders } from '~/composables'
import { usePreferredTruckersStore } from '~/stores/preferredTruckers.store'
import { storeToRefs } from 'pinia'
import allTruckers from '~/fixtures/truckers.json'
import { pullAllBy } from 'lodash'
import { useAlertStore } from '~/stores/alert.store'

const alertStore = useAlertStore()
const preferredTruckersStore = usePreferredTruckersStore()
const { preferredTruckers } = storeToRefs(preferredTruckersStore)
const { smAndDown } = useDisplay()
const showActions = ref(true)
const tableHeight = ref(0)
const inviteTruckerDialog = ref(false)

// const confirmInviteTruckerDialog = ref(false)
const deleteTruckerDialog = ref(false)

const { truckersListHeaders } = useHeaders()
const { truckersListActions } = useActions()
const { getFormattedDateTime } = useDate()
const searchValue = ref(null)
const loading = ref(false)
const mutableEntities = ref(preferredTruckers)
const preferedScacSearch = ref()
const computedEntities = computed({
  get() {
    return mutableEntities.value
  },
  set(value) {
    mutableEntities.value = value
  },
})

const confirmSendInvitation = trucker => {
  inviteTruckerDialog.value.show(true)
  inviteTruckerDialog.value.data = trucker
}
const containerActionHandler = ({ action, e }) => {
  if (action === 'to-message') {
  }
  if (action === 'delete-trucker') {
    deleteTruckerDialog.value.show(true)
    deleteTruckerDialog.value.data = e[0]
  }
}
const deleteTrucker = () => {
  preferredTruckersStore.deleteTrucker(deleteTruckerDialog.value.data)
  deleteTruckerDialog.value.show(false)
}
const customFilter = (search, lists) => {
  preferedScacSearch.value = search
  const result = [
    lists[0].filter(i => i.scac.toLowerCase() === search.toLowerCase()),

    lists[1].filter(i => i.scac.toLowerCase() === search.toLowerCase()),
  ]

  return result
}

/*const sendInvitation = async () => {
  try {
    const result = await preferredTruckersStore.inviteTrucker('testEmail@test.com')
    if (result === 'sentInvitation') {
      confirmInviteTruckerDialog.value.show(false)
      setTimeout(() => {
        alertStore.info({ content: 'The invitation has been sent!' })
      }, 500)
    }
  } catch (e) {
    console.error(e)
  }
}*/

const tableId = 'truckersListTable'
onMounted(() => {
  setTimeout(() => {
    const table = document.getElementById(tableId)
    tableHeight.value = smAndDown.value
      ? 396
      : window.innerHeight - table.getBoundingClientRect().top - 95
  })
})
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-4"
  >
    Preferred truckers list
  </Typography>
  <Typography
    :color="getColor('textSecondary')"
    class="w-full md:w-11/12 lg:w-8/12 mb-10"
  >
    Here you can manage your list of preferred truckers. To add a trucker to the list — find him on
    the platform using the search box and after add him. If the trucker is not yet on the platform —
    send him an invitation via email.
  </Typography>
  <div class="flex justify-between flex-wrap gap-5 mb-5">
    <AutocompleteGroups
      :lists="[preferredTruckers, pullAllBy(allTruckers, preferredTruckers, 'scac')]"
      label="Search for truckers by SCAC and email"
      multiple2-list=""
      item-title="scac"
      item-value="email"
      class="max-w-[500px] min-w-[280px]"
      :custom-filter="customFilter"
      :hide-no-data="preferedScacSearch?.length < 4"
      @onSelect="e => {}"
      @onSelectMultiple="item => preferredTruckersStore.addTrucker(item)"
    >
      <template #noData>
        <Typography class="mb-5">
          There is no such trucker on the platform. Do you want to send an invitation via email?
        </Typography>
        <Button
          class="w-full"
          @click="confirmSendInvitation"
        >
          Invite new trucker
        </Button>
      </template>
    </AutocompleteGroups>
    <Button
      class="px-12"
      @click="inviteTruckerDialog.show(true)"
    >
      Invite new trucker
    </Button>
  </div>
  <VirtualTable
    :id="tableId"
    key="bookings"
    :entities="computedEntities"
    :headers="truckersListHeaders"
    :loading="loading"
    :options="{
      rowHeight: 64,
      showActions,
      tableHeight: tableHeight,
      tableMinWidth: 960,
    }"
    class="mb-5"
  >
    <template #scacEmail="{ item }">
      <div>
        <Typography>
          <Highlighter
            v-if="searchValue"
            :query="searchValue"
          >
            {{ item.scac }}
          </Highlighter>
          <template v-else>
            {{ item.scac }}
          </template>
        </Typography>
        <Typography :color="getColor('textSecondary')">
          <Highlighter
            v-if="searchValue"
            :query="searchValue"
          >
            {{ item.email }}
          </Highlighter>
          <template v-else>
            {{ item.email }}
          </template>
        </Typography>
      </div>
    </template>
    <template #company="{ item }">
      <Typography>
        <Highlighter
          v-if="searchValue"
          :query="searchValue"
        >
          {{ item.company }}
        </Highlighter>
        <template v-else>
          {{ item.company }}
        </template>
      </Typography>
    </template>
    <template #lastBooking="{ item }">
      <Typography>
        {{ item.lastBooking ? getFormattedDateTime(item.lastBooking) : '--' }}
      </Typography>
    </template>

    <template #actions="{ item, selected }">
      <MenuActions
        :actions="truckersListActions"
        :selected="selected"
        :container="item"
        @containerActionHandler="containerActionHandler"
      />
    </template>
  </VirtualTable>
  <Dialog
    ref="inviteTruckerDialog"
    max-width="480"
  >
    <template #text>
      <InviteTruckerDialog @close="inviteTruckerDialog.show(false)" />
    </template>
  </Dialog>
  <!--
    <Dialog
    ref="confirmInviteTruckerDialog"
    max-width="480"
    >
    <template #text>
    <div class="flex justify-between">
    <Typography>
    Are you sure you want to send an invitation to trucker <b>{{ confirmInviteTruckerDialog.data.email }}</b>?
    </Typography>
    <IconButton
    icon="mdi-close"
    class="-mt-1"
    @click="confirmInviteTruckerDialog.show(false)"
    />
    </div>
    <Button
    class="w-full mt-10"
    @click="sendInvitation"
    >
    Save
    </Button>
    </template>
    </Dialog>
  -->
  <Dialog
    ref="deleteTruckerDialog"
    max-width="480"
  >
    <template #text>
      <RemoveCancelDialog
        btn-name="Delete"
        @close="deleteTruckerDialog.show(false)"
        @onClickBtn="deleteTrucker"
      >
        <Typography>
          Are you sure you want to remove trucker <b>{{ deleteTruckerDialog.data.email }}</b>
          your preferred list?
        </Typography>
      </RemoveCancelDialog>
    </template>
  </Dialog>
</template>

<style lang="scss" scoped></style>
