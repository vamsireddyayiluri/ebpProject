import { defineStore } from 'pinia'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAlertStore } from '~/stores/alert.store'
import { useAuthStore } from '~/stores/auth.store'

export const useNotificationStore = defineStore('notification', () => {
  const alertStore = useAlertStore()
  const { userData } = useAuthStore()
  const notifications = ref([
    {
      title: 'Trucker ABCD registered on the platform',
      content: '02/20/2022 5:23:17 am',
      type: 'info',
      isUnread: true,
    },
    {
      title: 'Trucker ABCD registered on the platform',
      content: '02/20/2022 5:23:17 am',
      type: 'warning',
    },
    {
      title: 'Trucker ABCD registered on the platform',
      content: '02/20/2022 5:23:17 am',
      type: 'success',
    },
  ])
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

  return {
    notifications,
    addNewNotification,
    defaultSettings,
    settings,
    loading,
    createNotificationCollection,
    getNotificationSettings,
    updateSettings,
  }
})
