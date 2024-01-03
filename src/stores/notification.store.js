import { defineStore } from 'pinia'
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
  const { userData } = useAuthStore()
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
      await setDoc(doc(db, 'notifications', orgId), { settings: defaultSettings })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const getNotificationSettings = async () => {
    loading.value = true
    try {
      const settingsDoc = await getDoc(doc(db, 'notifications', userData.orgId))
      if (!settingsDoc.exists()) {
        await createNotificationCollection(userData.orgId)
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
      await updateDoc(doc(db, 'notifications', userData.orgId), {
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
  const getNotifications = async () => {
    try {
      const notificationsRef = collection(db, 'notifications')
      const dataQuery = query(notificationsRef, where('orgId', '==', userData.orgId))
      await onSnapshot(dataQuery, snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'modified') {
            // get last element .at(-1)
            showAlert(change.doc.data().list.at(-1))
          }
        })
        notifications.value = snapshot.docs[0].data().list
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
  }
})
