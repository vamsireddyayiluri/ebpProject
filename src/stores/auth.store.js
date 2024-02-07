import { defineStore, getActivePinia } from 'pinia'
import { auth, db } from '~/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getStorage, ref as firebaseRef, uploadBytes } from 'firebase/storage'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { useAlertStore } from '~/stores/alert.store'
import { getLocalTime } from '@qualle-admin/qutil/dist/date'
import { getOrgId } from '~/stores/helpers'
import { userTypes } from '~/constants/userTypes'
import firebase from 'firebase/compat/app'
import { useInvitationStore } from '~/stores/invitation.store'
import { useNotificationStore } from '~/stores/notification.store'
import { useBookingsStore } from "~/stores/bookings.store";

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const alertStore = useAlertStore()
  const invitationStore = useInvitationStore()
  const notificationStore = useNotificationStore()
  const bookingsStore = useBookingsStore()
  const currentUser = ref(null)
  const storage = getStorage()
  const userData = ref(null)
  const orgData = ref(null)
  const isLoading = ref(null)
  const workers = ref([])

  const login = async ({ email, password }) => {
    isLoading.value = true
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      currentUser.value = user
      await getUser()
      router.push({ name: 'dashboard' })
    } catch (error) {
      isLoading.value = false
      switch (error.code) {
      case 'auth/user-not-found':
        alertStore.warning({ content: 'User not found' })
        break
      case 'auth/wrong-password':
        alertStore.warning({ content: 'Wrong password' })
        break
      case 'auth/invalid-login-credentials':
        alertStore.warning({ content: 'Invalid credentials' })
        break
      default:
        alertStore.warning({ content: 'Something went wrong' })
      }
    }
  }
  const logout = async () => {
    await signOut(auth)

    currentUser.value = null
    userData.value = null
    orgData.value = null
    await bookingsStore.reset()
    await router.push({ name: 'login' })
  }

  const register = async ({
    form,
    yards,
    invitations,
    requiresForTruckers,
    questionList,
    onboardingDocuments,
  }) => {
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password)
      await signInWithEmailAndPassword(auth, form.email, form.password)
      const orgId = await getOrgId(form.email)
      await addDoc(collection(db, 'pending_verifications'), {
        fullName: form.fullName,
        email: form.email,
        orgId,
        cell: form.cell,
        password: form.password,
        company: form.companyName,
        yards,
        type: userTypes.admin,
        invitations,
        requiresForTruckers,
        questionList,
      })
      for (const file of onboardingDocuments) {
        try {
          const fileRef = firebaseRef(storage, `uploads/${orgId}/${file.name}`)
          await uploadBytes(fileRef, file)
        } catch ({ message }) {
          alertStore.warning({ content: "File wasn't uploaded " + message })
        }
      }
      await router.push({ name: 'verify1' })
      isLoading.value = false
      await sendVerificationEmail()
    } catch (error) {
      switch (error.code) {
      case 'auth/email-already-in-use':
        alertStore.warning({ content: 'Email already in use' })
        break
      case 'auth/invalid-email':
        alertStore.warning({ content: 'Invalid email' })
        break
      case 'auth/operation-not-allowed':
        alertStore.warning({ content: 'Operation not allowed' })
        break
      case 'auth/weak-password':
        alertStore.warning({ content: 'Weak password' })
        break
      default:
        alertStore.warning({ content: 'Something went wrong' })
      }
      isLoading.value = false
    }
  }

  const getUser = async () => {
    isLoading.value = true
    await auth.onAuthStateChanged(async user => {
      if (user === null) {
        currentUser.value = null
        isLoading.value = false
      } else {
        currentUser.value = user
        await getUserData(user.uid)
        if (userData.value) {
          await getOrgData(userData.value.orgId)
        } else isLoading.value = false
        if (router.currentRoute.value.name === 'login') {
          router.push({ name: 'dashboard' })
        }
      }
    })
  }

  // Sending verification email to registered user
  const sendVerificationEmail = async () => {
    try {
      await sendEmailVerification(auth.currentUser, {
        url: `${import.meta.env.VITE_APP_CANONICAL_URL}/dashboard`,
      })
      alertStore.info({ content: 'Verification email sent!' })
    } catch (error) {
      alertStore.warning({ content: error })
    }
  }

  // Creating user and organization collection after verification complete
  const registerCompleteAction = async verification => {
    let user = auth.currentUser
    const data = verification[0]
    if (!user) {
      try {
        user = await firebase.auth().signInWithEmailAndPassword(data.email, data.password)
      } catch (error) {
        alertStore.warning({ content: error.message })
      }
    }

    try {
      auth.currentUser.emailVerified = true
      const { uid: userId } = user
      let newUser = {
        fullName: data.fullName,
        email: data.email,
        cell: data.cell,
        createdAt: getLocalTime().format(),
        updatedAt: getLocalTime().format(),
        userId: userId,
        orgId: data.orgId,
        password: data.password,
        type: userTypes.admin,
        company: data.company,
      }

      await setDoc(doc(db, 'users', userId), newUser)
      userData.value = newUser

      const docRef = doc(db, 'organizations', data.orgId)
      const orgSnap = await getDoc(docRef)
      if (!orgSnap.exists()) {
        const orgData = {
          orgId: data.orgId,
          email: data.email,
          company: data.company,
          createdAt: getLocalTime().format(),
          updatedAt: getLocalTime().format(),
          workDetails: data.yards,
          bookingRules: {},
        }
        await setDoc(docRef, orgData)
      }

      if (data.invitations) {
        await invitationStore.sendInvitationLink(data.invitations)
      }
      await setDoc(doc(db, 'trucker_requirements', data.orgId), {
        requiresForTruckers: data.requiresForTruckers,
        questionList: data.questionList,
      })
      await notificationStore.createNotificationCollection(data.orgId)
      await deleteDoc(doc(db, 'pending_verifications', data.id))
      await getUser()

      router.push({ name: 'dashboard' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // Getting pending verification data from the collection
  const getVerificationData = async email => {
    const q = query(collection(db, 'pending_verifications'), where('email', '==', email))

    const querySnapshot = await getDocs(q)

    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return data
  }

  // Getting user Data from the user collection based on the login user id
  const getUserData = async userId => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists) {
        userData.value = userDoc.data()
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // Getting current user organization data from the organization collection
  const getOrgData = async orgId => {
    try {
      onSnapshot(doc(db, 'organizations', orgId), async doc => {
        if (doc.data()) {
          orgData.value = doc.data()
          await getOrgWorkers()
          isLoading.value = false
        }
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // update company name in organization collection
  const updateCompanyNameInOrg = async payload => {
    const { orgId, companyName } = payload
    try {
      await updateDoc(doc(db, 'organizations', orgId), { company: companyName })
      alertStore.info({ content: 'Company Name updated!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const saveUserDataReports = async payload => {
    const { emptyContainerReport, exportFacilityReport } = payload
    try {
      await updateDoc(doc(db, 'users', userData.value.userId), {
        emptyContainerDataReport: emptyContainerReport?.value,
        exporterFacilityDataReport: exportFacilityReport?.value,
      })
      await getUserData(userData.value.userId)
      alertStore.info({ content: 'Data report updated!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const getOrgWorkers = async () => {
    const q = query(collection(db, 'users'), where('orgId', '==', userData.value.orgId))
    const querySnapshot = await getDocs(q)
    workers.value = querySnapshot.docs.map(doc => doc.data())
  }

  return {
    login,
    logout,
    register,
    currentUser,
    isLoading,
    getUser,
    sendVerificationEmail,
    registerCompleteAction,
    getVerificationData,
    getUserData,
    userData,
    orgData,
    updateCompanyNameInOrg,
    saveUserDataReports,
    getOrgData,
    workers,
  }
})
