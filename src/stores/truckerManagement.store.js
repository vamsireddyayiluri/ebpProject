import { defineStore } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'
import listRequiresForTruckers from '~/fixtures/requiresForTruckers.json'
import { useAuthStore } from '~/stores/auth.store'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { deleteObject, listAll, ref as firebaseRef, uploadBytes } from 'firebase/storage'
import { db, storage } from '~/firebase'

export const useTruckerManagementStore = defineStore('truckerManagement', () => {
  const alertStore = useAlertStore()
  const requiresForTruckers = ref(listRequiresForTruckers)
  const questionList = ref([])
  const onboardingDocuments = ref([])
  const preferredTruckersList = ref([])

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
  const getOnboardingDocuments = async () => {
    const { userData } = useAuthStore()
    const folderPath = `uploads/${userData.orgId}/`
    try {
      const folderRef = firebaseRef(storage, folderPath)
      const filesList = await listAll(folderRef)
      onboardingDocuments.value = filesList.items.map(fileRef => fileRef)
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const addDoc = async file => {
    const { userData } = useAuthStore()

    // for register page
    if (!userData) {
      onboardingDocuments.value.push(file)

      return
    }
    try {
      const fileRef = firebaseRef(storage, `uploads/${userData.orgId}/${file.name}`)
      const exist = await isFileExists(fileRef)
      if (exist) {
        alertStore.warning({ content: `File with name ${file.name} exist` })
      } else {
        await uploadBytes(fileRef, file)
        onboardingDocuments.value.push(file)
        alertStore.info({ content: 'File was uploaded' })
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const removeDoc = async fileName => {
    const { userData } = useAuthStore()

    // for register page
    if (!userData) {
      const index = onboardingDocuments.value.findIndex(f => f.name === fileName)
      onboardingDocuments.value.splice(index, 1)

      return
    }
    const filePath = `uploads/${userData.orgId}/${fileName}`
    try {
      const fileRef = firebaseRef(storage, filePath)
      await deleteObject(fileRef)
      const index = onboardingDocuments.value.findIndex(f => f.name === fileName)
      onboardingDocuments.value.splice(index, 1)
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const isFileExists = async fileRef => {
    return onboardingDocuments.value.some(i => i.name === fileRef.name)
  }

  return {
    requiresForTruckers,
    questionList,
    onboardingDocuments,
    preferredTruckersList,
    getTruckerRequirements,
    addAdditionalQuestion,
    removeQuestion,
    saveTruckerRequirements,
    getOnboardingDocuments,
    addDoc,
    removeDoc,
  }
})

