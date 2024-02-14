<script setup>
import { useActions, useDate, useHeaders } from '~/composables'
import { getLineAvatar } from '~/firebase/getLineAvatar'
import { useDisplay } from 'vuetify'
import { useBookingsStore } from '~/stores/bookings.store'
import { useAuthStore } from '~/stores/auth.store'

const props = defineProps({
  computedEntities: Array,
  searchValue: String,
  loading: Boolean,
})
const emit = defineEmits(['selectTableRow', 'editDraft'])
const { userData } = useAuthStore()
const { deleteBooking } = useBookingsStore()
const { smAndDown, width } = useDisplay()
const showActions = ref(true)
const tableHeight = ref(1)
const deleteDraftDialog = ref(false)

const { draftsHeaders } = useHeaders()
const { draftsActions } = useActions()
const { getFormattedDateTime, getFormattedDate } = useDate()

const containerActionHandler = ({ action, e }) => {
  if (action === 'edit-draft') emit('editDraft', e[0].id)
  if (action === 'delete-draft') {
    deleteDraftDialog.value.show(true)
    deleteDraftDialog.value.data = e[0]
  }
}

const onSelectRow = e => {
  emit('selectTableRow', e)
}
const deleteDraft = id => {
  deleteBooking(id, true)
  deleteDraftDialog.value.show(false)
}
const tableId = 'draftTable'
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
    :headers="draftsHeaders(userData.type)"
    :loading="loading"
    :options="{
      rowHeight: 64,
      tableHeight: tableHeight,
      showActions,
      tableMinWidth: 960,
    }"
    class="mb-5"
    @onSelectRow="onSelectRow"
  >
    <template #ref="{ item }">
      <Typography type="text-body-m-regular">
        <Highlighter
          v-if="searchValue"
          :query="searchValue"
        >
          {{ item.ref }}
        </Highlighter>
        <template v-else>
          {{ item.ref }}
        </template>
      </Typography>
    </template>
    <template #ssl="{ item }">
      <img
        :src="getLineAvatar(item.line?.id)"
        :alt="item.line?.label"
        class="h-8"
      />
    </template>
    <template #yardLabel="{ item }">
      <FlexTypography type="text-body-m-regular">
        <Highlighter
          v-if="searchValue"
          :query="searchValue"
        >
          {{ item.location?.label }}
        </Highlighter>
        <template v-else>
          {{ item.location?.label }}
        </template>
      </FlexTypography>
    </template>
    <template #worker="{ item }">
      <Typography>
        {{ item.createdBy.name }}
      </Typography>
    </template>
    <template #bookingExpiry="{ item }">
      <Typography type="text-body-m-regular">
        {{ getFormattedDate(item.loadingDate) }}
        <Tooltip>
          {{ getFormattedDateTime(item.loadingDate) }}
        </Tooltip>
      </Typography>
    </template>
    <template #location="{ item }">
      <LocationChip :location="item?.location" />
    </template>
    <template #actions="{ item, selected }">
      <MenuActions
        :actions="draftsActions"
        :selected="selected"
        :container="item"
        @containerActionHandler="containerActionHandler"
      />
    </template>
  </VirtualTable>

  <Dialog
    ref="deleteDraftDialog"
    max-width="480"
  >
    <template #text>
      <RemoveCancelDialog
        btn-name="Delete"
        @close="deleteDraftDialog.show(false)"
        @onClickBtn="deleteDraft(deleteDraftDialog.data.id)"
      >
        <Typography>
          Are you sure you want to delete draft#
          <b>{{ deleteDraftDialog.data.ref }}</b
          >?
        </Typography>
      </RemoveCancelDialog>
    </template>
  </Dialog>
</template>

<style lang="scss"></style>
