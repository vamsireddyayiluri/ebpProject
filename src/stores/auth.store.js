import { defineStore } from 'pinia'
import { auth, db } from '~/firebase'
import {
  addDoc,
  collection,
  getDocs,
  query,
  setDoc,
  where,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from 'firebase/firestore'
import moment from 'moment-timezone'
import { getDownloadURL, getStorage, ref as sref, uploadBytes } from 'firebase/storage'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
  updateEmail,
  reload,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth'
import { useAlertStore } from '~/stores/alert.store'
import { getLocalServerTime, getLocalTime } from '@qualle-admin/qutil/dist/date'
import { getOrgId } from '~/stores/helpers'
import { uid } from 'uid'
import listRequiresForTruckers from '~/fixtures/requiresForTruckers.json'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const alertStore = useAlertStore()
  const currentUser = ref(null)
  const storage = getStorage()
  const userData = ref(null)
  const orgData = ref(null)
  const invitedUsersData = ref(null)
  const isLoading = ref(null)
  const onboardingDocuments = ref([])
  const requiresForTruckers = ref(listRequiresForTruckers)
  const preferredTruckersList = ref([])
  const questionList = ref([])
  const yardList = ref([])

  const login = async ({ email, password }) => {
    isLoading.value = true
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      console.log('-> user', user)
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

  const register = async ({ form, members, location }) => {
    isLoading.value = true
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password)
      await signInWithEmailAndPassword(auth, form.email, form.password)

      await addDoc(collection(db, 'pending_verifications'), {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        cell: form.workPhone,
        password: form.password,
        company: form.companyName,
        scac: form.scacCode,
        type: form.type,
        invitations: members || [],
        location: location || [],
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
        }
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
      const orgId = await getOrgId(data.email)
      let newUser = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        cell: data.cell,
        emptyContainerDataReport: false,
        exporterFacilityDataReport: false,
        createdAt: getLocalTime().format(),
        updatedAt: getLocalTime().format(),
        userId: userId,
        orgId: orgId,
        password: data.password,
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
          email: data.email,
          company: data.company,
          yards: data.location,
          orgId: orgId,
          type: data.type,
          scac: data.scac,
          createdAt: getLocalTime().format(),
          updatedAt: getLocalTime().format(),
        }
        await setDoc(docRef, orgData)
      }

      if (data.invitations) {
        inviteNewMember({ invitations: data.invitations, companyName: data.company, userId })
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
    isLoading.value = true
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

  // removing invited user
  const removeInvitedUser = async payload => {
    const { docId, isLoggedIn } = payload
    try {
      if (isLoggedIn) {
        // await deleteDoc(doc(db, 'users', docId))
        // getAuth().
        // deleteUser(docId)
      } else {
        await deleteDoc(doc(db, 'invitations', docId))
      }
      alertStore.info({ message: 'User removed!' })
    } catch ({ message }) {
      alertStore.warning({ message })
    }
  }

  // Getting invited users data from the users and invitations collection
  const getInvitedUsersData = async userId => {
    invitedUsersData.value = []
    try {
      const q1 = query(collection(db, 'users'), where('invitedBy', '==', userId))
      const querySnapshot = await getDocs(q1)
      querySnapshot.docs.map(val => {
        invitedUsersData.value.push({
          id: val.data().email,
          value: val.data().email,
          type: val.data().type,
          isLoggedIn: true,
          docId: val.id,
        })
      })
      const q2 = query(collection(db, 'invitations'), where('invitedBy', '==', userId))
      const querySnapshot2 = await getDocs(q2)
      querySnapshot2.docs.map(val => {
        invitedUsersData.value.push({
          id: val.data().email,
          value: val.data().email,
          type: val.data().type,
          isLoggedIn: false,
          docId: val.id,
        })
      })
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

  // Sending invitation email to invited users
  const inviteNewMember = async ({ invitation, companyName, userId }) => {
    try {
      const q = query(collection(db, 'invitations'), where('email', '==', invitation.email))

      const querySnapshot = await getDocs(q)
      let inviteId = uid(28)

      if (!querySnapshot.empty) {
        inviteId = querySnapshot.docs[0].id
      }
      await setDoc(
        doc(db, 'invitations', `${inviteId}`),
        {
          email: invitation.email,
          orgId: userData.value.orgId,
          type: invitation.type,
          createdAt: getLocalServerTime(moment(), 'America/Los_Angeles').format(),
          expiredAt: getLocalServerTime(moment(), 'America/Los_Angeles').add(2, 'days').format(),
          companyName,
          invitedBy: userId,
        },
        { merge: true },
      )

      await addDoc(collection(db, 'mail'), {
        to: invitation.email,
        message: {
          subject: 'Hello from Qualle!',
          html:
            userData.value.email +
            ` invites you to organization` +
            `${companyName}` +
            `as a ${invitation.type}` +
            `.<br /><br /> Use this <a href="${
              import.meta.env.VITE_APP_CANONICAL_URL
            }/invitation-verify?invite=${inviteId}">link</a> to sign up with ${invitation.email} ` +
            ' to connect to the organization.<br />Have a good day',
        },
      })
      alertStore.info({ content: 'Invitation email sent!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // validating invitation link wheater id is exists in collection or not
  const checkInvitation = async id => {
    try {
      const docSnap = await getDoc(doc(db, 'invitations', `${id}`))
      if (docSnap.exists()) {
        const expiry = docSnap.data().expiredAt
        const today = getLocalServerTime(moment(), 'America/Los_Angeles')
        if (moment(expiry).isSameOrAfter(moment(today))) {
          return true
        } else {
          router.push({ name: 'invitation-expired' })
        }
      } else {
        router.push({ name: 'invitation-revoked' })
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // getting invitation data based on the doc id
  const getInvitationDocData = async id => {
    try {
      const docSnap = await getDoc(doc(db, 'invitations', `${id}`))
      if (docSnap.exists()) {
        return docSnap.data()
      } else {
        return null
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // removing yard location form the organization collection

  const removeYardLocationFromOrg = async (location, orgId) => {
    try {
      await updateDoc(doc(db, 'organizations', orgId), {
        yards: arrayRemove(location),
      })
      alertStore.info({ content: 'Regions removed!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // Adding yard location to the organization collection

  const updateYardDetails = async (locations, orgId) => {
    try {
      await updateDoc(doc(db, 'organizations', orgId), {
        yards: arrayUnion(...locations),
      })
      alertStore.info({ content: 'Regions Added!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // validating email is exists in the user collection or not to invite
  const validateInviteUserEmail = async payload => {
    const q = query(collection(db, 'users'), where('email', '==', payload))

    const docData = await getDocs(q)
    if (docData.empty) {
      return false
    } else {
      return true
    }
  }

  // const updateInvitedUserType = async payload => {
  //   console.log(' in vited user payload', payload)
  // }

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

  const addYard = yard => {
    yardList.value.push(yard)

    return Promise.resolve()
  }

  const removeYard = yard => {
    const index = yardList.value.findIndex(q => q === yard)
    yardList.value.splice(index, 1)
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
    checkInvitation,
    getInvitationDocData,
    inviteNewMember,
    updateUserEmailAddress,
    updateUserPassword,
    userData,
    orgData,
    updateUserData,
    updateOrgData,
    updateCompanyNameInOrg,
    removeInvitedUser,
    getInvitedUsersData,
    invitedUsersData,
    removeYardLocationFromOrg,
    updateYardDetails,
    validateInviteUserEmail,
    saveUserDataReports,
    onboardingDocuments,
    saveOnboardingDocuments,
    requiresForTruckers,
    preferredTruckersList,
    questionList,
    addAdditionalQuestion,
    removeQuestion,
    yardList,
    addYard,
    removeYard,
  }
})
