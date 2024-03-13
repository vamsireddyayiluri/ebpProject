import { auth } from '~/firebase'

const getValidatedUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe()
      resolve(user)
    }, reject)
  })
}
export const onBeforeRoute = async (to, from, next) => {
  const currentUser = await getValidatedUser()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const redirectTo = to.meta.redirect

  if (requiresAuth && !currentUser) {
    next('/login')
  } else if (requiresAuth && currentUser && !currentUser.emailVerified) {
    next('/verify1')
  } else if (requiresAuth && currentUser && redirectTo) {
    next(redirectTo)
  } else if (requiresAuth && currentUser) {
    next()
  } else {
    next()
  }
}
