import { defineStore } from 'pinia'
import { useAlertStore } from "~/stores/alert.store"
import listRequiresForTruckers from '~/fixtures/requiresForTruckers.json'

export const useTruckerManagementStore = defineStore('truckerManagementStore', () => {
  const alertStore = useAlertStore()
  const onboardingDocuments = ref([])
  const requiresForTruckers = ref(listRequiresForTruckers)
  const preferredTruckersList = ref([])
  const questionList = ref([])

  const saveOnboardingDocuments = files => {
    onboardingDocuments.value = files
  }

  const addAdditionalQuestion = question => {
    questionList.value.push(question)
  }

  const removeQuestion = question => {
    const index = questionList.value.findIndex(q => q === question)
    questionList.value.splice(index, 1)
  }

  return {
    onboardingDocuments,
    saveOnboardingDocuments,
    requiresForTruckers,
    preferredTruckersList,
    questionList,
    addAdditionalQuestion,
    removeQuestion,
  }
})

