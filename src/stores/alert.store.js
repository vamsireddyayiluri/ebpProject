import { defineStore } from 'pinia'

export const useAlertStore = defineStore('alert', () => {
  const alert = ref({ show: false })

  const text = ({ title, message, timeout }) => {
    alert.value = { show: true, title, message, type: 'text', timeout }
  }

  const info = ({ title, message, timeout }) => {
    alert.value = { show: true, title, message, type: 'info', timeout }
  }

  const warning = ({ title, message, timeout }) => {
    alert.value = { show: true, title, message, type: 'warning', timeout }
  }

  const close = () => {
    alert.value = { show: false }
  }

  return { alert, close, text, info, warning }
})
