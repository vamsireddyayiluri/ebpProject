import { defineStore, storeToRefs } from 'pinia'
import { doc, updateDoc } from 'firebase/firestore'
import { useAlertStore } from '~/stores/alert.store'
import { useAuthStore } from '~/stores/auth.store'
import { useDate } from '~/composables'
import {
  getDownloadURL,
  ref as firebaseRef,
  uploadBytes,
  deleteObject,
  list,
} from 'firebase/storage'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reload,
  updateProfile,
  verifyBeforeUpdateEmail,
} from 'firebase/auth'

import { auth, db, storage } from '~/firebase'

export const useProfileStore = defineStore('profile', () => {
  const authStore = useAuthStore()
  const alertStore = useAlertStore()
  const { currentUser, userData } = storeToRefs((authStore))
  const { getFormattedDateTime } = useDate()
  const accountInfo = ref({
    name: null,
    company: null,
    cell: null,
    email: null,
    password: null,
    passwordLastChanges: null,
    imageUrl: null,
  })

  const getProfileData = () => {
    accountInfo.value = {
      name: userData.value.name,
      company: userData.value.company,
      cell: userData.value.cell,
      email: userData.value.email,
      password: userData.value.password,
      passwordLastChanges:
        'Last change ' + getFormattedDateTime(currentUser.value.reloadUserInfo.passwordUpdatedAt),
      imageUrl: currentUser.value.photoURL,
    }
  }

  // Uploading user profile image into firebase storage
  const updateUserAvatar = async file => {
    try {
      // remove old
      const folderRef = firebaseRef(storage, `avatar/${userData.value.user_id}`)
      const filesList = await list(folderRef)
      await Promise.all(filesList.items.map(file => deleteObject(file)))

      const fileRef = firebaseRef(storage, `avatar/${userData.value.user_id}/${file.name}`)
      const url = await uploadBytes(fileRef, file).then(async snapshot => {
        return await getDownloadURL(snapshot.ref)
      })
      await updateProfile(auth.currentUser, { photoURL: url })
      alertStore.info({ content: 'Image updated!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  // update user data in users collection
  const updateUserData = async payload => {
    const { userId, name, company, cell } = payload
    try {
      await updateDoc(doc(db, 'users', userId), { name, company, cell })
      await updateDoc(doc(db, 'organizations', userData.value.orgId), { company })
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
        await verifyBeforeUpdateEmail(user, newEmail)
        await updateDoc(doc(db, 'users', user.uid), { email: newEmail })
        await updateDoc(doc(db, 'organizations', userData.value.orgId), { email: newEmail })
        await reload(user)
      } catch ({ message: content }) {
        alertStore.warning({ content })
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const updateUserPassword = async payload => {
    const { userId, password } = payload
    try {
      await updateDoc(doc(db, 'users', userId), { password })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const reset = () => {
    accountInfo.value = {
      name: null,
      company: null,
      cell: null,
      email: null,
      password: null,
      passwordLastChanges: null,
      imageUrl: null,
    }
  }

  return {
    accountInfo,
    getProfileData,
    updateUserAvatar,
    updateUserData,
    updateUserEmailAddress,
    updateUserPassword,
    reset,
  }
})
