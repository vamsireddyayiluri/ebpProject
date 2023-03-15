import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import routes from '~pages'

import { onBeforeRoute } from './helpers'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...setupLayouts(routes)],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => onBeforeRoute(to, from, next))

export default router
