import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', () => {
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

  return { notifications, addNewNotification }
})
