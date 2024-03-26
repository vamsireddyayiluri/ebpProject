<script setup>
import { getColor } from '~/helpers/colors'
import { useTruckerManagementStore } from '~/stores/truckerManagement.store'
import { storeToRefs } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'
import { useHeaders, useDocumentsChip } from '~/composables'
import truckers from '~/fixtures/preferredTruckers.json'
import { isEqual, cloneDeep } from 'lodash'

const alertStore = useAlertStore()
const truckerManagement = useTruckerManagementStore()
const { truckersDocumentsHeaders } = useHeaders()
const { requiresForTruckers, questionList } = storeToRefs(truckerManagement)
const openedPanel = ref([2])
const loading = ref(false)
const documentsDialog = ref(null)
const onboardingTruckersList = ref([])
let truckerManagementDB = ref({ requiresForTruckers: null, questionList: null })
const isDisabled = ref(false)

const validateRequirements = computed(() => {
  isDisabled.value = isEqual(
    { requiresForTruckers: requiresForTruckers.value, questionList: questionList.value },
    {
      requiresForTruckers: truckerManagementDB.requiresForTruckers,
      questionList: truckerManagementDB.questionList,
    },
  )

  return isDisabled.value
})
const openDocuments = (doc, item) => {
  documentsDialog.value.show(true)
  documentsDialog.value.data = doc
  documentsDialog.value.selectedItem = item
}
const saveTruckerRequirements = async () => {
  const data = await truckerManagement.saveTruckerRequirements({
    requiresForTruckers: requiresForTruckers.value,
    questionList: questionList.value,
  })
  truckerManagementDB = cloneDeep(data)
  isDisabled.value = true
}
const cancelChanges = async () => {
  const data = await truckerManagement.getTruckerRequirements()
  requiresForTruckers.value = cloneDeep(data.requiresForTruckers)
  questionList.value = cloneDeep(data.questionList)
}
const acceptDocument = async () => {
  updateDocumentStatus()
}
const declineDocument = async reason => {
  updateDocumentStatus(reason)
}
const updateDocumentStatus = async (reason = null) => {
  const { selectedItem, data } = documentsDialog.value
  const payload = { selectedItem, data, status: 'approved' }
  if (reason) {
    payload.status = 'declined'
    payload.reason = reason
  }
  await truckerManagement.updateOnboardingDocStatus(payload)
  onboardingTruckersList.value = await truckerManagement.getOnboardedTruckers()
  documentsDialog.value.show(false)
}

const getTruncatedFileName = fileName => {
  const name = `${fileName?.substring(0, 15)}...`
  return fileName?.length > 15 ? name : fileName
}
onMounted(async () => {
  loading.value = true
  const data = await truckerManagement.getTruckerRequirements()
  truckerManagementDB = cloneDeep(data)
  await truckerManagement.getOnboardingDocuments()
  onboardingTruckersList.value = await truckerManagement.getOnboardedTruckers()
  loading.value = false
})
</script>

<template>
  <Typography
    type="text-h1"
    class="mb-8"
  >
    Trucker management
  </Typography>
  <ExpansionPanels
    v-model="openedPanel"
    multiple
  >
    <ExpansionPanel elevation="0">
      <ExpansionPanelTitle :color="getColor('uiSecondary-02')">
        <Typography type="text-h4"> Trucker requirements </Typography>
      </ExpansionPanelTitle>
      <ExpansionPanelText class="w-full md:w-2/3 lg:w-4/3 pt-4">
        <div>
          <TruckerRequirements :scac-section="false" />
          <SaveCancelChanges
            class="mt-10"
            :disabled="validateRequirements || isDisabled"
            @onSave="saveTruckerRequirements"
            @onCancel="cancelChanges"
          />
        </div>
      </ExpansionPanelText>
    </ExpansionPanel>
    <ExpansionPanel elevation="0">
      <ExpansionPanelTitle :color="getColor('uiSecondary-02')">
        <Typography type="text-h4"> Required onboarding documents </Typography>
      </ExpansionPanelTitle>
      <ExpansionPanelText class="w-full md:w-2/3 lg:w-4/3 pt-4">
        <div>
          <FileUpload />
        </div>
      </ExpansionPanelText>
    </ExpansionPanel>
    <ExpansionPanel elevation="0">
      <ExpansionPanelTitle :color="getColor('uiSecondary-02')">
        <Typography type="text-h4"> Onboarding </Typography>
      </ExpansionPanelTitle>
      <ExpansionPanelText class="pt-4">
        <VirtualTable
          id="truckersDocumentsTable"
          :entities="onboardingTruckersList"
          :headers="truckersDocumentsHeaders"
          :loading="loading"
          :options="{
            rowHeight: 64,
            showActions: false,
            tableHeight: 680,
            tableMinWidth: 960,
          }"
          class="mb-5"
        >
          <template #trucker="{ item }">
            <div>
              <Typography>
                {{ item?.truckerScac || '--' }}
              </Typography>
              <Typography :color="getColor('textSecondary')">
                {{ item.truckerEmail || '--' }}
              </Typography>
            </div>
          </template>
          <template #company="{ item }">
            <Typography>
              {{ item.truckerCompany || '--' }}
            </Typography>
          </template>
          <template #documents="{ item }">
            <div class="flex gap-2 z-50">
              <template v-if="item.documents.length <= 2">
                <template
                  v-for="(i, index) in item.documents"
                  :key="index"
                >
                  <Chip
                    :prepend-icon="useDocumentsChip()[i.status]?.icon"
                    :color="useDocumentsChip()[i.status]?.color"
                    @click="openDocuments(i, item)"
                  >
                    {{ getTruncatedFileName(i.filename) }}
                    <Popover
                      activator="parent"
                      location="top "
                      class="pl-2"
                    >
                      <div class="flex justify-center gap-2 py-1">
                        <span>{{ i.filename }}</span>
                      </div>
                    </Popover>
                  </Chip>
                </template>
              </template>
              <template v-if="item.documents.length > 2">
                <template
                  v-for="(i, index) in item.documents.slice(0, 1)"
                  :key="index"
                >
                  <Chip
                    :prepend-icon="useDocumentsChip()[i.status]?.icon"
                    :color="useDocumentsChip()[i.status]?.color"
                    @click="openDocuments(i, item)"
                  >
                    {{ getTruncatedFileName(i.filename) }}
                    <Popover
                      activator="parent"
                      location="top "
                      class="pl-2"
                    >
                      <div class="flex justify-center gap-2 py-1">
                        <span>{{ i.filename }}</span>
                      </div>
                    </Popover>
                  </Chip>
                </template>
                <Menu
                  location="bottom end"
                  offset="3"
                >
                  <template #activator="{ props }">
                    <span
                      v-bind="props"
                      v-on="on"
                      class="mt-2"
                    >
                      +{{ item.documents?.length - 1 }}
                      more
                    </span>
                  </template>
                  <List>
                    <ListItem
                      v-for="(i, index) in item.documents.slice(1)"
                      :key="index"
                    >
                      <Chip
                        :prepend-icon="useDocumentsChip()[i.status]?.icon"
                        :color="useDocumentsChip()[i.status]?.color"
                        @click="openDocuments(i, item)"
                      >
                        {{ getTruncatedFileName(i.filename) }}
                        <Popover
                          activator="parent"
                          location="top "
                          class="pl-2"
                        >
                          <div class="flex justify-center gap-2 py-1">
                            <span>{{ i.filename }}</span>
                          </div>
                        </Popover>
                      </Chip>
                    </ListItem>
                  </List>
                </Menu>
              </template>
            </div>
          </template>
        </VirtualTable>
      </ExpansionPanelText>
    </ExpansionPanel>
  </ExpansionPanels>
  <Dialog
    ref="documentsDialog"
    max-width="85vw"
  >
    <template #text>
      <DocumentViewerDialog
        :doc="documentsDialog.data"
        @acceptDoc="acceptDocument()"
        @declineDoc="declineDocument"
        @close="documentsDialog.show(false)"
      />
    </template>
  </Dialog>
</template>

<style lang="scss" scoped></style>
