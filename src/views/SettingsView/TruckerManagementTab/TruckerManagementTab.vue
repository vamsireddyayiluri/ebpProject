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
const openDocuments = (doc, id) => {
  documentsDialog.value.show(true)
  documentsDialog.value.data = doc
  documentsDialog.value.selectedItem = id
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

  const { selectedItem, data } = documentsDialog.value
  await truckerManagement.approveOnboardingDoc({ selectedItem, data })
}
const declineDocument = async reason => {
  console.log('decline documnet', reason)
}
onMounted(async () => {
  const data = await truckerManagement.getTruckerRequirements()
  truckerManagementDB = cloneDeep(data)
  await truckerManagement.getOnboardingDocuments()
  onboardingTruckersList.value = await truckerManagement.getOnboardedTruckers()
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
              <template
                v-for="(i, index) in item.documents"
                :key="index"
              >
                <Chip
                  :prepend-icon="useDocumentsChip()[i.status]?.icon"
                  :color="useDocumentsChip()[i.status]?.color"
                  @click="openDocuments(i, item.id)"
                >
                  {{ i.name }}
                </Chip>
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
        @declineDoc="declineDocument(reason)"
        @close="documentsDialog.show(false)"
      />
    </template>
  </Dialog>
</template>

<style lang="scss" scoped></style>
