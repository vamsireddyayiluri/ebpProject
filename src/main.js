import App from '~/App.vue'
import router from '~/router'
import vuetify from '~/plugins/vuetify'
import { loadFonts } from '~/plugins/webfontloader'
import { initializeChatbot } from '~/plugins/chatBotLoader'
import interceptors from '~/helpers/interceptors'

import '~/styles/styles.scss'
import '@core/scss/index.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

loadFonts()
initializeChatbot()
const app = createApp(App)

app.use(vuetify)
app.use(createPinia())
app.use(router)
interceptors()

app.mount('#app')
