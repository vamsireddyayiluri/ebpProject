export const filterMatchingObjects = (searchedData, filteredData, key = 'id') => {

  const map = new Map()

  for (const obj of searchedData) {
    const keyValue = obj[key]
    map.set(keyValue, obj)
  }

  const intersection = []

  for (const obj of filteredData) {
    const keyValue = obj[key]
    if (map.has(keyValue)) {
      intersection.push(obj)
    }
  }

  return intersection
}
