import { auth } from '~/firebase'

export const onBeforeRoute = (to, from, next) => {
  const currentUser = auth.currentUser
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !currentUser) {
    next('/login')
  } else if (requiresAuth && currentUser && !currentUser.emailVerified) {
    next('/verify')
  } else if (requiresAuth && currentUser) {
    next()
  } else {
    next()
  }
}
