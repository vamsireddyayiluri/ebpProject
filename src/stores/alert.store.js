import { defineStore } from 'pinia'

export const useAlertStore = defineStore({
  id: 'alert',
  state: () => ({
    alert: null,
  }),
  actions: {
    text({ title, message, timeout }) {
      this.alert = { title, message, type: 'text' }
      if (timeout) this.timeout()
    },
    info({ title, message, timeout }) {
      this.alert = { title, message, type: 'info' }
      if (timeout) this.timeout()
    },
    warning({ title, message, timeout }) {
      this.alert = { title, message, type: 'warning' }
      if (timeout) this.timeout()
    },
    timeout() {
      setTimeout(() => {
        this.clear()
      }, 2000)
    },
    clear() {
      this.alert = null
    },
  },
})
