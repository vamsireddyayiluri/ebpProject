import { defineStore } from 'pinia'

export const useAlertStore = defineStore('alert', () => {
  const alertList = ref([])
  const show = ref( false )
  const defaultTimeout = 5000

  const text = ({ title, content, timeout = defaultTimeout }) => {
    const id = title + content
    alertList.value.push({ title, content, type: 'text' })
    show.value = true
    close(id, timeout)
  }

  const info = ({ title, content, timeout = defaultTimeout }) => {
    const id = title + content
    alertList.value.push({ id, title, content, type: 'info', timeout })
    show.value = true
    close(id, timeout)
  }

  const warning = ({ title, content, timeout = defaultTimeout}) => {
    const id = title + content
    alertList.value.push({ title, content, type: 'warning' })
    show.value = true
    close(id, timeout)
  }

  const close = (id, timeout) => {
    setTimeout(() => {
      const index = alertList.value.findIndex(i => i.id === id)
      alertList.value.splice(index, 1)
    }, timeout)
  }

  return { show, alertList, text, info, warning }
})
