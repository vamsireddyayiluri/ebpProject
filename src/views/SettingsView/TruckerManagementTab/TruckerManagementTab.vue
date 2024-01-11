<script setup>
import { getColor } from '~/helpers/colors'
import { useTruckerManagementStore } from '~/stores/truckerManagement.store'
import { storeToRefs } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'
import { useHeaders, useDocumentsChip } from '~/composables'
import truckers from '~/fixtures/preferredTruckers.json'
import { isEqual } from 'lodash'

const alertStore = useAlertStore()
const truckerManagement = useTruckerManagementStore()
const { truckersDocumentsHeaders } = useHeaders()
const { requiresForTruckers, questionList } = storeToRefs(truckerManagement)
const openedPanel = ref([2])
const loading = ref(false)
const documentsDialog = ref(null)
const truckerManagementDB = ref({ requiresForTruckers: null, questionList: null })

const validateRequirements = computed(() => {
  return isEqual(
    { requiresForTruckers: requiresForTruckers.value, questionList: questionList.value },
    {
      requiresForTruckers: truckerManagementDB.value.requiresForTruckers,
      questionList: truckerManagementDB.value.questionList,
    },
  )
})
const openDocuments = doc => {
  documentsDialog.value.show(true)
  documentsDialog.value.data = doc
}
const saveTruckerRequirements = async () => {
  const data = await truckerManagement.saveTruckerRequirements({
    requiresForTruckers: requiresForTruckers.value,
    questionList: questionList.value,
  })
  truckerManagementDB.value = data
}
const cancelChanges = async () => {
  const data = await truckerManagement.getTruckerRequirements()
  requiresForTruckers.value = data.requiresForTruckers
  questionList.value = data.questionList
}

onMounted(async () => {
  const data = await truckerManagement.getTruckerRequirements()
  truckerManagementDB.value = data
  await truckerManagement.getOnboardingDocuments()
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
        <Typography type="text-h4">
          Trucker requirements
        </Typography>
      </ExpansionPanelTitle>
      <ExpansionPanelText class="w-full md:w-2/3 lg:w-4/3 pt-4">
        <div>
          <TruckerRequirements :scac-section="false" />
          <SaveCancelChanges
            class="mt-10"
            :disabled="validateRequirements"
            @onSave="saveTruckerRequirements"
            @onCancel="cancelChanges"
          />
        </div>
      </ExpansionPanelText>
    </ExpansionPanel>
    <ExpansionPanel elevation="0">
      <ExpansionPanelTitle :color="getColor('uiSecondary-02')">
        <Typography type="text-h4">
          Required onboarding documents
        </Typography>
      </ExpansionPanelTitle>
      <ExpansionPanelText class="w-full md:w-2/3 lg:w-4/3 pt-4">
        <div>
          <FileUpload />
        </div>
      </ExpansionPanelText>
    </ExpansionPanel>
    <ExpansionPanel elevation="0">
      <ExpansionPanelTitle :color="getColor('uiSecondary-02')">
        <Typography type="text-h4">
          Onboarding
        </Typography>
      </ExpansionPanelTitle>
      <ExpansionPanelText class="pt-4">
        <VirtualTable
          id="truckersDocumentsTable"
          key="bookings"
          :entities="truckers"
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
                {{ item.scac }}
              </Typography>
              <Typography :color="getColor('textSecondary')">
                {{ item.email }}
              </Typography>
            </div>
          </template>
          <template #company="{ item }">
            <Typography>
              {{ item.company }}
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
                  @click="openDocuments(i)"
                >
                  {{ i.label }}
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
    max-width="680"
  >
    <template #text>
      <DocumentViewerDialog
        :doc="documentsDialog.data"
        @close="documentsDialog.show(false)"
      />
    </template>
  </Dialog>
</template>

<style lang="scss" scoped></style>
