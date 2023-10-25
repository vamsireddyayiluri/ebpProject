import { defineStore } from 'pinia'

export const useAlertStore = defineStore('alert', () => {
  const alert = ref({ show: false })

  const text = ({ title, content, timeout }) => {
    alert.value = { show: true, title, content, type: 'text', timeout }
  }

  const info = ({ title, content, timeout }) => {
    alert.value = { show: true, title, content, type: 'info', timeout }
  }

  const warning = ({ title, content, timeout }) => {
    alert.value = { show: true, title, content, type: 'warning', timeout }
  }

  const close = () => {
    alert.value = { show: false }
  }

  return { alert, close, text, info, warning }
})
