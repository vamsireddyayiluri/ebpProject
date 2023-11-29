import { defineStore } from 'pinia'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from '~/firebase'
import { useAuthStore } from '~/stores/auth.store'
import { useAlertStore } from '~/stores/alert.store'
import { getLocalServerTime, getLocalTime } from '@qualle-admin/qutil/dist/date'
import moment from 'moment-timezone'
import { sendSignInLinkToEmail, signInWithEmailLink, updatePassword } from 'firebase/auth'

export const useInvitationStore = defineStore('invitation', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const invitedUsersData = ref([])
  const isLoading = ref(null)
  const router = useRouter()

  // validating email is exists in the user collection or not to invite
  const validateInviteUserEmail = async payload => {
    const q = query(collection(db, 'users'), where('email', '==', payload))

    const docData = await getDocs(q)

    return !docData.empty
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

  // Getting invited users data from the users and invitations collection
  const getInvitedUsersData = async userId => {
    const invitations = []
    try {
      const q1 = query(collection(db, 'users'), where('invitedBy', '==', userId))
      const querySnapshot = await getDocs(q1)
      querySnapshot.docs.map(val => {
        invitations.push({
          id: val.data().id,
          value: val.data().email,
          type: val.data().type,
          isLoggedIn: true,
          workerId: val.data().workerId,
        })
      })
      const q2 = query(collection(db, 'invitations'), where('invitedBy', '==', userId))
      const querySnapshot2 = await getDocs(q2)
      querySnapshot2.docs.map(val => {
        invitations.push({
          id: val.data().id,
          value: val.data().email,
          type: val.data().type,
          isLoggedIn: false,
          workerId: val.data().workerId,
        })
      })
      invitedUsersData.value = invitations
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // create invitation collection and send invitation mail
  const sendInvitationLink = async members => {
    for (const m of members) {
      const q = query(collection(db, 'invitations'), where('email', '==', m.value))

      const querySnapshot = await getDocs(q)
      const exist = await validateInviteUserEmail(m.value)

      if (!querySnapshot.empty || exist) {
        console.log(!querySnapshot.empty, exist)
        continue
      }
      const newInvitation = {
        id: m.id,
        email: m.value,
        orgId: authStore.userData.orgId,
        type: m.type,
        createdAt: getLocalServerTime(moment(), 'America/Los_Angeles').format(),
        expiredAt: getLocalServerTime(moment(), 'America/Los_Angeles').add(2, 'days').format(),
        company: authStore.userData.company,
        invitedBy: authStore.userData.userId,
        workerId: m.workerId,
      }
      await setDoc(doc(db, 'invitations', m.id), newInvitation, { merge: true })

      try {
        await sendSignInLinkToEmail(auth, m.value, {
          url: `${import.meta.env.VITE_APP_CANONICAL_URL}/?email=${m.value}&id=${m.id}`,
          handleCodeInApp: true,
        })
        invitedUsersData.value.push(newInvitation)
        alertStore.info({ content: 'Invitations send!' })
      } catch (e) {
        isLoading.value = false
        alertStore.warning({ content: e.message })
      }
    }
  }

  // Creating user collection after verification complete
  const invitedUserRegistration = async form => {
    isLoading.value = true
    try {
      const data = await signInWithEmailLink(auth, form.email, window.location.href)
      router.push({ name: 'dashboard' })
      authStore.currentUser = data.user
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
        invitedBy: form.invitedBy,
      }
      await setDoc(doc(db, 'users', data.user.uid), newUser)
      await authStore.getUser()
      await updatePassword(auth.currentUser, form.password)
      await deleteDoc(doc(db, 'invitations', form.id))
      await router.push({ name: 'dashboard' })
      isLoading.value = false
    } catch (e) {
      alertStore.warning({ content: e.message })
    }
  }

  // removing invited user
  const removeInvitedUser = async id => {
    try {
      const userDoc = await getDoc(doc(db, 'users', id))
      const invitationDoc = await getDoc(doc(db, 'invitations', id))

      try {
        if (userDoc.exists()) {
          await deleteDoc(doc(db, 'users', id))
        }
        if (invitationDoc.exists()) {
          await deleteDoc(doc(db, 'invitations', id))
        }
        invitedUsersData.value = invitedUsersData.value.filter(i => i.id !== id)
        alertStore.info({ content: 'User removed!' })

        return 'deleted'
      } catch ({ message }) {
        alertStore.warning({ content: message })
      }
    } catch (error) {
      alertStore.warning({ content: error.message })
    }
  }

  return {
    invitedUsersData,
    isLoading,
    validateInviteUserEmail,
    checkInvitation,
    getInvitationDocData,
    getInvitedUsersData,
    sendInvitationLink,
    invitedUserRegistration,
    removeInvitedUser,
  }
})
