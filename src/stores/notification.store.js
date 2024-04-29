import { defineStore } from 'pinia'
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAlertStore } from '~/stores/alert.store'
import { useAuthStore } from '~/stores/auth.store'
import { uid } from 'uid'
import { useDate } from '~/composables'

export const useNotificationStore = defineStore('notification', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const notifications = ref([])
  const { getFormattedDateTime } = useDate()
  let initialLoad = true
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
    const docId = `@${authStore.userData.name.replace(/\s+/g, '_')}_${authStore.userData.orgId}`

    try {
      await setDoc(doc(db, 'notifications', docId), {
        settings: defaultSettings,
        notifications: [],
        orgId,
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  const getNotificationSettings = async () => {
    loading.value = true
    try {
      const docId = `@${authStore.userData.name.replace(/\s+/g, '_')}_${authStore.userData.orgId}`
      const settingsDoc = await getDoc(doc(db, 'notifications', docId))
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
      const docId = `@${authStore.userData.name.replace(/\s+/g, '_')}_${authStore.userData.orgId}`
      await updateDoc(doc(db, 'notifications', docId), {
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
  const getNotifications = async () => {
    if (unsubscribeNotification) {
      unsubscribeNotification()
    }
    try {
      const docId = `@${authStore.userData.name.replace(/\s+/g, '_')}_${authStore.userData.orgId}`

      unsubscribeNotification = await onSnapshot(doc(db, 'notifications', docId), snapshot => {
        let notificationsData = null
        notificationsData = requiredData(snapshot.data()?.notifications)
        const list = notificationsData.at(-1)
        if (
          !initialLoad &&
          list.isUnread === true &&
          notificationsData.length !== notifications.value.length
        ) {
          showAlert(list)
        }
        initialLoad = false
        notifications.value = notificationsData.reverse() || []
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const requiredData = notificationsData => {
    let notifications = notificationsData?.map(notification => {
      return {
        content: getFormattedDateTime(notification.created) || notification.content,
        isUnread: notification?.isUnread,
        title: notification.message || notification.title,
        type: 'info',
        id: uid(16),
      }
    })

    return notifications
  }
  const showAlert = ({ type, ...rest }) => {
    alertStore[type]({ ...rest })
  }

  const readAllNotifications = async () => {
    const data = notifications.value.map(i => {
      return {
        ...i,
        isUnread: false,
      }
    })
    try {
      const docId = `@${authStore.userData.name.replace(/\s+/g, '_')}_${authStore.userData.orgId}`
      await updateDoc(doc(db, 'notifications', docId), {
        notifications: data,
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
      const docId = `@${authStore.userData.name.replace(/\s+/g, '_')}_${authStore.userData.orgId}`
      await updateDoc(doc(db, 'notifications', docId), {
        notifications: data,
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
