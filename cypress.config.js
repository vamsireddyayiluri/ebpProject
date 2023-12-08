require('dotenv').config()
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: 'https://ebpv3-69501.web.app/',
    env: {
      ...process.env,
    },
    testIsolation: false,
  },
})
