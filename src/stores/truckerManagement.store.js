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
  query,
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
import axios from 'axios'

export const useTruckerManagementStore = defineStore('truckerManagement', () => {
  const alertStore = useAlertStore()
  const requiresForTruckers = ref(JSON.parse(JSON.stringify(listRequiresForTruckers)))
  const questionList = ref([])
  const onboardingDocuments = ref([])
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
    try {
      const docData = await getDoc(doc(db, 'trucker_requirements', userData.orgId))
      onboardingDocuments.value = docData.data()?.onBoardingDocuments || []
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
      const fileRef = firebaseRef(storage, `uploads/exporter/${userData.orgId}/${file.name}`)
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
              path: downloadURL,
              filename: file.name,
              type: file.type,
            }),
          },
          { merge: true },
        )
        onboardingDocuments.value.push({
          id: uid(),
          path: downloadURL,
          filename: file.name,
          type: file.type,
        })
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
    const filePath = `uploads/exporter/${userData.orgId}/${fileName}`
    try {
      const fileRef = firebaseRef(storage, filePath)
      await deleteObject(fileRef)
      const truckerManagementRef = doc(db, 'trucker_requirements', userData.orgId)

      const { onBoardingDocuments } = (await getDoc(truckerManagementRef)).data()

      const updatedDocs = onBoardingDocuments.filter(doc => doc.filename !== fileName)

      await updateDoc(truckerManagementRef, {
        onBoardingDocuments: updatedDocs,
      })
      alertStore.info({ content: 'File was deleted' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const isFileExists = async fileRef => {
    return onboardingDocuments.value?.some(i => i.name === fileRef.name)
  }
  const getTruckerDetails = async orgId => {
    const q = query(collection(db, 'organizations'), where('orgId', '==', orgId))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map(doc => doc.data())[0]
  }

  const getOnboardedTruckers = async () => {
    try {
      const q = await query(
        collection(db, 'onboarding_documents'),
        where('exporterOrgId', '==', userData.orgId),
      )
      const onboardingDocsSnapshot = await getDocs(q)
      if (!onboardingDocsSnapshot.empty) {
        const docDataPromises = onboardingDocsSnapshot.docs.map(async docSnapshot => {
          // Use the correct way to reference a sub-collection depending on your SDK
          const documentsQuery = collection(docSnapshot.ref, 'documents')
          const documentsSnapshot = await getDocs(documentsQuery)

          const documentsData = documentsSnapshot.docs.map(document => document.data())

          return { ...docSnapshot.data(), documents: documentsData }
        })
        const docData = await Promise.all(docDataPromises)

        return docData
      }

      return []
    } catch (error) {
      console.log('error', error)
    }
  }

  const updateOnboardingDocStatus = async payload => {
    const { selectedItem, data, status, reason = null } = payload
    try {
      const query = doc(db, 'onboarding_documents', selectedItem.id, 'documents', data.id)

      const docStatus = { status: status }
      if (reason) {
        docStatus.reason = reason
      }
      await updateDoc(query, docStatus)

      const emailData = {
        status,
        reason,
        attachments: [data],
        exporterOrgId: selectedItem.exporterOrgId,
        truckerOrgId: selectedItem.truckerOrgId,
      }

      await axios.post(
        `${
          import.meta.env.VITE_APP_CANONICAL_URL
        }/api/v1/onboardingDocuments/docUpdated/sendNotification`,
        emailData,
      )
    } catch (error) {
      console.log('error', error)
    }
  }

  return {
    requiresForTruckers,
    questionList,
    onboardingDocuments,
    getTruckerRequirements,
    addAdditionalQuestion,
    removeQuestion,
    saveTruckerRequirements,
    getOnboardingDocuments,
    addDoc,
    removeDoc,
    getTruckerDetails,
    getOnboardedTruckers,
    updateOnboardingDocStatus,
  }
})
