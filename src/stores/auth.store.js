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
  updatePassword,
  sendSignInLinkToEmail, signInWithEmailLink,
} from 'firebase/auth'
import { useAlertStore } from '~/stores/alert.store'
import { getLocalServerTime, getLocalTime } from '@qualle-admin/qutil/dist/date'
import { getOrgId } from '~/stores/helpers'
import { uid } from 'uid'
import { userTypes } from "~/constants/userTypes"
import firebase from 'firebase/compat/app'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const alertStore = useAlertStore()
  const currentUser = ref(null)
  const storage = getStorage()
  const userData = ref(null)
  const orgData = ref(null)
  const invitedUsersData = ref(null)
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

  const register = async ({ form, yards }) => {
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
        // inviteNewMember({ invitations: data.invitations, company: data.company, userId })
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

  // validating email is exists in the user collection or not to invite
  const validateInviteUserEmail = async payload => {
    const q = query(collection(db, 'users'), where('email', '==', payload))

    const docData = await getDocs(q)

    return !docData.empty
  }

  // Send in
  const sendInvitationLink = async members => {
    for (const m of members) {
      const q = query(collection(db, 'invitations'), where('email', '==', m.value))

      const querySnapshot = await getDocs(q)
      let inviteId = uid(28)

      if (!querySnapshot.empty) {
        console.log('empty')
        inviteId = querySnapshot.docs[0].id
      }
      await setDoc(
        doc(db, 'invitations', `${inviteId}`),
        {
          email: m.value,
          orgId: userData.value.orgId,
          type: m.type,
          createdAt: getLocalServerTime(moment(), 'America/Los_Angeles').format(),
          expiredAt: getLocalServerTime(moment(), 'America/Los_Angeles').add(2, 'days').format(),
          company: userData.value.company,
          invitedBy: userData.value.userId,
        },
        { merge: true },
      )

      try {
        await sendSignInLinkToEmail(auth, m.value, {
          url: `${import.meta.env.VITE_APP_CANONICAL_URL}/?email=${m.value}&id=${inviteId}`,
          handleCodeInApp: true,
        })
        alertStore.info({content: 'Invitations send!'})

      } catch (e) {
        isLoading.value = false
        alertStore.warning({content: e.message})
      }
    }
  }

  // Creating user collection after verification complete
  const invitedUserRegistration = async form => {
    isLoading.value = true
    try {
      const data = await signInWithEmailLink(auth, form.email, window.location.href)
      router.push({ name: 'dashboard' })
      currentUser.value = data.user
      const newUser = {
        fullName: form.fullName,
        email: form.email,
        createdAt: form.createdAt,
        updatedAt: getLocalTime().format(),
        userId: data.user.uid,
        orgId: form.orgId,
        password: form.password,
        type: form.type,
        company: form.company,
      }
      await setDoc(doc(db, 'users', data.user.uid), newUser)
      userData.value = newUser
      await getOrgData(form.orgId)
      await updatePassword(auth.currentUser, form.password)
      await router.push({name: 'dashboard'})
      isLoading.value = false
    } catch (e) {
      alertStore.warning({content: e.message})
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
    checkInvitation,
    getInvitationDocData,
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
    validateInviteUserEmail,
    saveUserDataReports,
    getOrgData,
    invitedUserRegistration,
    sendInvitationLink,
  }
})
