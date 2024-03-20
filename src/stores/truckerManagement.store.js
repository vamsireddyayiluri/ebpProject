import { defineStore } from 'pinia'
import { useAlertStore } from '~/stores/alert.store'
import listRequiresForTruckers from '~/fixtures/requiresForTruckers.json'
import { useAuthStore } from '~/stores/auth.store'
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import {
  deleteObject,
  listAll,
  ref as firebaseRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage'
import { db, storage } from '~/firebase'
import { uid } from 'uid'

export const useTruckerManagementStore = defineStore('truckerManagement', () => {
  const alertStore = useAlertStore()
  const requiresForTruckers = ref(JSON.parse(JSON.stringify(listRequiresForTruckers)))
  const questionList = ref([])
  const onboardingDocuments = ref([])
  const preferredTruckersList = ref([])
  const { userData } = useAuthStore()

  const getTruckerRequirements = async () => {
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
        const snapshot = await uploadBytes(fileRef, file)
        const downloadURL = await getDownloadURL(snapshot.ref)

        const truckerManagementRef = doc(db, 'trucker_requirements', userData.orgId)

        await setDoc(
          truckerManagementRef,
          {
            onBoardingDocuments: arrayUnion({
              id: uid(),
              fileURL: downloadURL,
              fileName: file.name,
            }),
          },
          { merge: true },
        )
        onboardingDocuments.value.push(file)
        alertStore.info({ content: 'File was uploaded' })
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const removeDoc = async fileName => {
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

  const getOnboardedTruckers = async () => {
    const query = collection(db, 'onboarding_documents')

    const onboardingDocs = await getDocs(query, where('exporterOrgId', '==', userData.orgId))

    if (!onboardingDocs.empty) {
      return onboardingDocs.docs.map(doc => doc.data())
    }
    return []
  }

  const approveOnboardingDoc = async payload => {
    const { selectedItem, data } = payload

    const query = doc(db, 'onboarding_documents', selectedItem)
    const docSnap = await getDoc(query)

    let documentsArray = docSnap.data().documents || []

    const docIndex = documentsArray.findIndex(doc => doc.name === data.name)

    if (docIndex !== -1) {
      documentsArray[docIndex] = { ...documentsArray[docIndex], status: 'approved' }
    }

    await updateDoc(query, { documents: documentsArray })
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
    getOnboardedTruckers,
    approveOnboardingDoc,
  }
})
