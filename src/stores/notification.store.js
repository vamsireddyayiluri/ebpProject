import {defineStore, storeToRefs} from 'pinia'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '~/firebase'
import { useAlertStore } from '~/stores/alert.store'
import { useAuthStore } from '~/stores/auth.store'

export const useNotificationStore = defineStore('notification', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const notifications = ref([])
  const defaultSettings = {
    newsAndUpdates: {
      value: 'both notifications',
      active: true,
    },
    bookingsNotification: {
      value: 'both notifications',
      active: true,
    },
  }
  const settings = ref(defaultSettings)
  const loading = ref(false)
  const createNotificationCollection = async orgId => {
    try {
      await setDoc(doc(db, 'notifications', orgId), { settings: defaultSettings, list: [], orgId })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const getNotificationSettings = async () => {
    loading.value = true
    try {
      const settingsDoc = await getDoc(doc(db, 'notifications', authStore.userData.orgId))
      if (!settingsDoc.exists()) {
        await createNotificationCollection(authStore.userData.orgId)
        settings.value = defaultSettings
        loading.value = false
      } else {
        settings.value = settingsDoc.data().settings
        loading.value = false
      }
    } catch ({ message }) {
      alertStore.warning({ content: message })
      loading.value = false
    }
  }

  const updateSettings = async data => {
    try {
      await updateDoc(doc(db, 'notifications', authStore.userData.orgId), {
        settings: data,
      })
      settings.value = data
      alertStore.info({ content: 'Notifications settings updated!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const addNewNotification = {
    info: toasty => {
      notifications.value.unshift({
        type: 'info',
        isUnread: true,
        ...toasty,
      })
    },
    warning: toasty => {
      notifications.value.unshift({
        type: 'warning',
        isUnread: true,
        ...toasty,
      })
    },
    success: toasty => {
      notifications.value.unshift({
        type: 'success',
        isUnread: true,
        ...toasty,
      })
    },
  }

  // get and subscribe notifications and show alert if was added new notification
  let unsubscribeNotification
  const getNotifications = async id => {
    if (unsubscribeNotification) {
      unsubscribeNotification()
    }
    try {
      const notificationsRef = collection(db, 'notifications')
      const dataQuery = query(notificationsRef, where('orgId', '==', authStore.userData.orgId))
      unsubscribeNotification = await onSnapshot(dataQuery, snapshot => {
        const list = snapshot.docs[0]?.data()?.list
        snapshot.docChanges().forEach(change => {
          if (change.type === 'modified' && list.length !== notifications.value.length) {
            // get last element .at(-1)
            showAlert(change.doc.data().list.at(-1))
          }
        })
        notifications.value = list.reverse() || []
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const showAlert = notification => {
    alertStore[notification.type]({
      title: notification.title,
      content: notification.content,
    })
  }

  const readAllNotifications = async () => {
    const data = notifications.value.map(i => {
      return {
        ...i,
        isUnread: false,
      }
    })
    try {
      await updateDoc(doc(db, 'notifications', authStore.userData.orgId), {
        list: data,
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const readNotification = async id => {
    const data = notifications.value.map(i => {
      if (i.id === id) {
        i.isUnread = false
      }

      return i
    })
    try {
      await updateDoc(doc(db, 'notifications', authStore.userData.orgId), {
        list: data,
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  return {
    notifications,
    addNewNotification,
    defaultSettings,
    settings,
    loading,
    createNotificationCollection,
    getNotificationSettings,
    updateSettings,
    getNotifications,
    readAllNotifications,
    readNotification,
  }
})
