import { isString } from 'lodash-es'

function includes (matcher = [], array = []) {
  if (isString(matcher)) matcher = [matcher]
  let found = false
  for (const m of matcher) {
    found = array.includes(m)
    if (found) break
  }
  return found
}

export default includes
