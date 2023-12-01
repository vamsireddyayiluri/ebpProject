import { defineStore } from 'pinia'
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
import { getDownloadURL, getStorage, ref as sref, uploadBytes } from 'firebase/storage'
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updateProfile,
} from 'firebase/auth'
import { useAlertStore } from '~/stores/alert.store'
import { getLocalTime } from '@qualle-admin/qutil/dist/date'
import { getOrgId } from '~/stores/helpers'
import { userTypes } from '~/constants/userTypes'
import firebase from 'firebase/compat/app'
import { useInvitationStore } from "~/stores/invitation.store"

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const alertStore = useAlertStore()
  const invitationStore = useInvitationStore()
  const currentUser = ref(null)
  const storage = getStorage()
  const userData = ref(null)
  const orgData = ref(null)
  const isLoading = ref(null)

  const login = async ({ email, password }) => {
    isLoading.value = true
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      currentUser.value = user
      router.push({ name: 'dashboard' })
      isLoading.value = false
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

    router.push({ name: 'login' })
  }

  const register = async ({ form, yards, invitations }) => {
    isLoading.value = true
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password)
      await signInWithEmailAndPassword(auth, form.email, form.password)

      await addDoc(collection(db, 'pending_verifications'), {
        fullName: form.fullName,
        email: form.email,
        cell: form.cell,
        password: form.password,
        company: form.companyName,
        yards,
        type: userTypes.admin,
        invitations,
      })
      router.push({ name: 'verify1' })
      isLoading.value = false
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
        url: `${import.meta.env.VITE_APP_DOMAIN}/dashboard`,
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
      const orgId = await getOrgId(data.email)
      let newUser = {
        fullName: data.fullName,
        email: data.email,
        cell: data.cell,
        createdAt: getLocalTime().format(),
        updatedAt: getLocalTime().format(),
        userId: userId,
        orgId: orgId,
        password: data.password,
        type: userTypes.admin,
        company: data.company,
      }

      const q = query(collection(db, 'invitations'), where('email', '==', data.email))
      const docData = await getDocs(q)

      if (!docData.empty) {
        const querySnapshot = docData.docs[0].data()

        newUser = { invitedBy: querySnapshot.invitedBy, ...newUser }
        docData.docs.map(async doc => await deleteDoc(doc.ref))
      }
      await setDoc(doc(db, 'users', userId), newUser)
      userData.value = newUser

      const docRef = doc(db, 'organizations', orgId)
      const orgSnap = await getDoc(docRef)
      if (!orgSnap.exists()) {
        const orgData = {
          orgId,
          email: data.email,
          company: data.company,
          createdAt: getLocalTime().format(),
          updatedAt: getLocalTime().format(),
          workDetails: data.yards,
        }
        await setDoc(docRef, orgData)
      }

      if (data.invitations) {
        await invitationStore.sendInvitationLink(data.invitations)
      }

      await deleteDoc(doc(db, 'pending_verifications', data.id))

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
      onSnapshot(doc(db, 'organizations', orgId), doc => {
        if (doc.data()) {
          orgData.value = doc.data()
          isLoading.value = false
        }
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // updating user email address

  const updateUserEmailAddress = async payload => {
    const { email, password, newEmail } = payload

    const user = auth.currentUser
    const credential = EmailAuthProvider.credential(email, password)
    try {
      await reauthenticateWithCredential(user, credential)
      try {
        await updateEmail(user, newEmail)
        await updateDoc(doc(db, 'users', user.uid), { email: newEmail })
        await reload(user)
        alertStore.info({ content: 'Email updated!' })
      } catch ({ message: content }) {
        alertStore.warning({ content })
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // update user data in users collection
  const updateUserData = async payload => {
    const { userId, firstName, lastName } = payload
    try {
      await updateDoc(doc(db, 'users', userId), { firstName, lastName })
      alertStore.info({ content: 'Profile updated!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // update org data in organizations collection
  const updateOrgData = async payload => {
    const { company, cell, type, scac, scacList, orgId } = payload
    try {
      if (cell !== userData.value.cell) {
        await updateDoc(doc(db, 'users', userData.value.userId), { cell })
      }
      await updateDoc(doc(db, 'organizations', orgId), { company, type, scac, scacList })
      setTimeout(() => {
        alertStore.info({ content: 'Organization updated!' })
      }, 1000)
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const updateUserPassword = async payload => {
    const { userId, password } = payload
    try {
      await updateDoc(doc(db, 'users', userId), { password })
      alertStore.info({ content: 'Password updated!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // update company name in organization collection
  const updateCompanyNameInOrg = async payload => {
    const { orgId, companyName } = payload
    try {
      await updateDoc(doc(db, 'organizations', orgId), { company: companyName })
      alertStore.info({ message: 'Company Name updated!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // Uploading user profile image into firebase storage
  const updateUserAvatar = async file => {
    try {
      const storageRef = sref(storage, 'avatar')

      const url = await uploadBytes(storageRef, file).then(async snapshot => {
        return await getDownloadURL(snapshot.ref)
      })
      await updateProfile(auth.currentUser, { photoURL: url })
      alertStore.info({ content: 'Image updated!' })
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
    updateUserAvatar,
    updateUserEmailAddress,
    updateUserPassword,
    userData,
    orgData,
    updateUserData,
    updateOrgData,
    updateCompanyNameInOrg,
    saveUserDataReports,
    getOrgData,
  }
})
