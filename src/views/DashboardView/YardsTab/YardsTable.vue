<script setup>
import { useActions, useDate, useHeaders } from '~/composables'
import { useDisplay } from 'vuetify'
import { getYardBookingLoad, getBookingLoad } from '~/helpers/countings'
import { useBookingsStore } from '~/stores/bookings.store'
import { useAuthStore } from '~/stores/auth.store'
import { statuses } from '~/constants/statuses'
import { getSmallerDate } from '~/composables/useDate'

const props = defineProps({
  computedEntities: Array,
  searchValue: String,
  loading: Boolean,
})
const emit = defineEmits(['selectTableRow', 'editBooking'])
const { userData } = useAuthStore()
const { deleteBooking, updateBookingStatus } = useBookingsStore()
const { smAndDown, width } = useDisplay()
const showActions = ref(true)
const tableHeight = ref(1)
const removeBookingDialog = ref(false)

const { yardsHeaders, bookingsHeaders } = useHeaders()
const { bookingsActions } = useActions()
const { getFormattedDate } = useDate()

const containerActionHandler = async ({ action, e }) => {
  if (action === 'edit-booking') emit('editBooking', e[0].id)
  if (action === 'remove-booking') {
    removeBookingDialog.value.show(true)
    removeBookingDialog.value.data = e[0]
  }
  if (action === 'pause-booking') {
    await updateBookingStatus(e[0], statuses.paused)
  }
  if (action === 'reactive-booking') {
    await updateBookingStatus(e[0], statuses.active)
  }
}
const onSelectRow = e => {
  emit('selectTableRow', e)
}
const formateMinTime = dates => {
  const minData = getSmallerDate(dates)
  return getFormattedDate(minData)
}
const formateTime = date => {
  return getFormattedDate(date)
}
const removeBooking = booking => {
  deleteBooking(booking)
  removeBookingDialog.value.show(false)
}
const tableId = 'yardsTable'
onMounted(() => {
  setTimeout(() => {
    const table = document.getElementById(tableId)
    tableHeight.value = smAndDown.value
      ? 396
      : window.innerHeight - table.getBoundingClientRect().top - 108
  })
})
</script>

<template>
  <VirtualTable
    :id="tableId"
    :entities="computedEntities"
    :headers="yardsHeaders"
    :loading="loading"
    :options="{
      rowHeight: 64,
      tableHeight: tableHeight,
      tableMinWidth: 960,
      expansionRow: true,
    }"
    @onSelectRow="onSelectRow"
  >
    <template #yardLabel="{ item }">
      <FlexTypography type="text-body-m-regular">
        <Highlighter
          v-if="searchValue"
          :query="searchValue"
        >
          {{ item.location.label }}
        </Highlighter>
        <template v-else>
          {{ item.location.label || '--' }}
        </template>
      </FlexTypography>
    </template>
    <template #location="{ item }">
      <Typography type="text-body-m-regular">
        <Highlighter
          v-if="searchValue"
          :query="searchValue"
        >
          {{ item.location.address }}
        </Highlighter>
        <template v-else>
          {{ item.location.address }}
        </template>
      </Typography>
    </template>
    <template #progress="{ item }">
      <ProgressLinear :value="getYardBookingLoad(item.entities).rate">
        {{ getYardBookingLoad(item.entities).rate }}%
      </ProgressLinear>
    </template>
    <template #expansion="{ item }">
      <VirtualTable
        :entities="item.entities"
        :headers="bookingsHeaders(userData.type)"
        :options="{
          rowHeight: 64,
          showActions,
          tableHeight: 575,
          tableMinWidth: 640,
        }"
        class="pl-16"
      >
        <template #ref="{ item }">
          <FlexTypography type="text-body-m-regular">
            <Highlighter
              v-if="searchValue"
              :query="searchValue"
            >
              {{ item.ref }}
            </Highlighter>
            <template v-else>
              {{ item.ref }}
            </template>
          </FlexTypography>
        </template>
        <template #containers="{ item }">
          <Typography> {{ item.committed }}/{{ item.containers }} </Typography>
        </template>
        <template #yardLabel="{ item }">
          <FlexTypography type="text-body-m-regular">
            {{ item.location.label || '--' }}
          </FlexTypography>
        </template>
        <template #ssl="{ item }">
          <LineAvatar :line="item.line" />
        </template>
        <template #size="{ item }">
          <Typography>
            <template v-if="item.flexibleBooking">
              <template
                v-for="i in item.size"
                :key="i"
              >
                {{ i }}
                <br />
              </template>
            </template>
            <template v-else>
              {{ item.size }}
            </template>
          </Typography>
        </template>
        <template #status="{ item }">
          <Classification
            type="status"
            :value="item.status"
          />
        </template>
        <template #bookingExpiry="{ item }">
          <Typography type="text-body-m-regular">
            {{ formateMinTime(item.details) || '--' }}
            <Typography
              type="text-body-xs-semibold"
              v-if="item.details?.length > 1"
            >
              + {{ item.details?.slice(1)?.length }} more</Typography
            >
            <Popover
              activator="parent"
              location="top center"
            >
              <div class="flex justify-center gap-2 py-1">
                <v-table>
                  <thead>
                    <tr>
                      <th class="text-left">Committed/Total</th>
                      <th class="text-left">Loading Date</th>
                      <th class="text-left">SCAC</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="data in item.details"
                      :key="data.date"
                    >
                      <td class="text-center">{{ data.committed }}/{{ data.containers }}</td>
                      <td>{{ formateTime(data.date) || '--' }}</td>
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
                </v-table>
              </div>
            </Popover>
          </Typography>
        </template>
        <template #location="{ item }">
          <LocationChip :location="item?.location" />
        </template>
        <template #worker="{ item }">
          <Typography>
            {{ item.createdBy?.name || '--' }}
          </Typography>
        </template>
        <template #progress="{ item }">
          <ProgressLinear :value="getBookingLoad(item.committed, item.containers)">
            {{ getBookingLoad(item.committed, item.containers) }}%
          </ProgressLinear>
        </template>
        <template #actions="{ item, selected }">
          <MenuActions
            :disabled="bookingsActions(item).length > 0 ? false : true"
            :actions="() => bookingsActions(item)"
            :selected="selected"
            :container="item"
            @containerActionHandler="containerActionHandler"
          />
        </template>
      </VirtualTable>
    </template>
  </VirtualTable>

  <Dialog
    ref="removeBookingDialog"
    max-width="480"
  >
    <template #text>
      <ConfirmationDialog
        btn-name="Remove"
        @close="removeBookingDialog.show(false)"
        @onClickBtn="removeBooking(removeBookingDialog.data)"
      >
        <Typography>
          Are you sure you want to remove ref#
          <b>{{ removeBookingDialog.data.ref }}</b>
          from your bookings?
        </Typography>
      </ConfirmationDialog>
    </template>
  </Dialog>
</template>

<style lang="scss"></style>
