import { defineStore } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'
import listRequiresForTruckers from '~/fixtures/requiresForTruckers.json'
import { useAuthStore } from '~/stores/auth.store'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '~/firebase'

export const useTruckerManagementStore = defineStore('truckerManagement', () => {
  const alertStore = useAlertStore()
  const requiresForTruckers = ref(listRequiresForTruckers)
  const questionList = ref([])
  const onboardingDocuments = ref([])
  const preferredTruckersList = ref([])

  const addAdditionalQuestion = question => {
    questionList.value.push(question)
  }
  const removeQuestion = async question => {
    const index = questionList.value.findIndex(q => q === question)
    questionList.value.splice(index, 1)
  }
  const saveTruckerRequirements = async requirements => {
    const { userData } = useAuthStore()
    const updatedData = {
      requiresForTruckers: requirements.requiresForTruckers,
      questionList: requirements.questionList,
    }
    try {
      await setDoc(doc(db, 'trucker_requirements', userData.orgId), updatedData)
      alertStore.info({ content: 'Trucker requirements saved' })

      return updatedData
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const saveOnboardingDocuments = files => {
    onboardingDocuments.value = files
  }
  const getTruckerRequirements = async () => {
    const { userData } = useAuthStore()
    const docData = await getDoc(doc(db, 'trucker_requirements', userData.orgId))
    if (!docData.data()) {
      return {}
    }
    requiresForTruckers.value = docData.data().requiresForTruckers
    questionList.value = docData.data().questionList

    return {
      requiresForTruckers: docData.data().requiresForTruckers,
      questionList: docData.data().questionList,
    }
  }

  return {
    requiresForTruckers,
    questionList,
    onboardingDocuments,
    preferredTruckersList,
    getTruckerRequirements,
    saveTruckerRequirements,
    addAdditionalQuestion,
    removeQuestion,
    saveOnboardingDocuments,
  }
})

