const { defineConfig } = require('cypress')
// const cypressFirebasePlugin = require('cypress-firebase').plugin
// const admin = require('firebase-admin')

module.exports = defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl:'https://ebpv3-69501.web.app/',
    // setupNodeEvents(on, config) {
      // e2e testing node events setup code
      // return cypressFirebasePlugin(on, config, admin, {
      //   // Here is where you can pass special options.
      //   // If you have not set the GCLOUD_PROJECT environment variable, give the projectId here, like so:
      //   projectId: 'ebpv3-69501',
      //   // if your databaseURL is not just your projectId plus ".firebaseio.com", then you _must_ give it here, like so:
      //   databaseURL: 'https://ebpv3-69501.firebaseio.com',
      // })
    // },
  },
})

