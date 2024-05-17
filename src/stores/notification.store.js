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
import { uid } from 'uid'
import { useDate } from '~/composables'
import { statuses } from '~/constants/statuses'

export const useNotificationStore = defineStore('notification', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const { getFormattedDateTime } = useDate()
  const notifications = ref([])
  const liveCommitments = ref([])
  const needsActionPopup = ref(false)
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
      if (!settingsDoc.data()?.settings) {
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
        const list = notificationsData?.length ? notificationsData[0]: null
        if (
          list && !initialLoad &&
          list?.isUnread === true &&
          notificationsData.length !== notifications.value.length
        ) {
          showAlert(list)
        }
        initialLoad = false
        notifications.value = notificationsData || []
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

    notifications?.sort((a, b) => {
      const dateA = new Date(a.content)
      const dateB = new Date(b.content)

      return dateB - dateA
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

  let unsubscribeLiveCommitments
  const getLiveCommitments = async () => {
    if (unsubscribeLiveCommitments) {
      unsubscribeLiveCommitments()
    }
    try {
      const q = await query(
        collection(db, 'commitments'),
        where('orgId', '==', authStore.userData.orgId),
        where('status', 'in', [statuses.approved, statuses.pending]),
      )
      await onSnapshot(q, snapshot => {
        const list = snapshot.docs
        const arr = []
        list.forEach(i => {
          arr.push(i.data())
        })
        arr.sort((a, b) => {
          const dateA = new Date(a.loadingDate)
          const dateB = new Date(b.loadingDate)

          return dateA - dateB
        })
        liveCommitments.value = arr
      })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  let popupTimeoutId = null
  const schedulePopupToShow = () => {
    clearTimeout(popupTimeoutId)
    popupTimeoutId = setTimeout(() => {
      needsActionPopup.value = true
    }, 60000)
  }
  const cancelAndHidePopup = () => {
    clearTimeout(popupTimeoutId)
    needsActionPopup.value = false
  }
  const reset = () => {
    notifications.value = []
  }

  return {
    notifications,
    addNewNotification,
    defaultSettings,
    settings,
    loading,
    liveCommitments,
    needsActionPopup,
    createNotificationCollection,
    getNotificationSettings,
    updateSettings,
    getNotifications,
    readAllNotifications,
    readNotification,
    getLiveCommitments,
    schedulePopupToShow,
    cancelAndHidePopup,
    reset,
  }
})
