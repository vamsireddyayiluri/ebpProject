import { defineStore } from 'pinia'

export const useAlertStore = defineStore('alert', () => {
  const alertList = ref([])
  const show = ref(false)
  const defaultTimeout = 5000
  const router = useRouter()

  const text = ({ title, content, timeout = defaultTimeout }) => {
    const id = title + content
    alertList.value.push({ id, title, content, type: 'text', timeout, close })
    show.value = true
    close(id, timeout)
  }
  const info = ({ title, content, timeout = defaultTimeout, button, addDeclineButtons }) => {
    const id = title + content
    alertList.value.push({
      id,
      title,
      content,
      type: 'info',
      button,
      addDeclineButtons,
      timeout,
      close,
    })
    show.value = true
    close(id, timeout)
  }

  const warning = ({ title, content, button, timeout = defaultTimeout }) => {
    const id = title + content
    alertList.value.push({ id, title, content, type: 'warning', button, timeout, close })
    show.value = true
    close(id, timeout)
  }

  const close = (id, timeout) => {
    setTimeout(() => {
      const index = alertList.value.findIndex(i => i.id === id)
      alertList.value.splice(index, 1)
      if (!alertList.value.length) {
        show.value = false
      }
    }, timeout)
  }

  const routerPush = async route => {
    await router.push(route)
  }

  return { show, alertList, text, info, warning, routerPush }
})
