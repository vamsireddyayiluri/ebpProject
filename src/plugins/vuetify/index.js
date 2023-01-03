import { createVuetify } from 'vuetify'
import defaults from './defaults'
import { icons } from './icons'
import theme from './theme'
import '@mdi/font/css/materialdesignicons.css'
import * as components from 'vuetify/components'

// Styles
import '@core/scss/libs/vuetify/index.scss'
import 'vuetify/styles'
export default createVuetify({
  components,
  defaults,
  icons,
  theme,
})
