import isSet from './is-set.js'

function pick (obj, items, excludeUnset) {
  const result = {}
  for (const item of items) {
    const [k, nk] = item.split(':')
    if (excludeUnset && !isSet(obj[k])) continue
    result[nk ?? k] = obj[k]
  }
  return result
}

export default pick
