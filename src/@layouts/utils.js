/**
 * Return nav link props to use
 * @param {Object, String} item navigation routeName or route Object provided in navigation data
 */
export const getComputedNavLinkToProp = computed(() => link => {
  const props = {
    target: link.target,
    rel: link.rel,
  }

  // If route is string => it assumes string is route name => Create route object from route name
  // If route is not string => It assumes it's route object => returns passed route object
  if (link.to) props.to = typeof link.to === 'string' ? { name: link.to } : link.to
  else props.href = link.href

  return props
})
