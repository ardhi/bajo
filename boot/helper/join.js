import { isPlainObject } from 'lodash-es'
import isSet from './is-set.js'

const join = (array, sep) => {
  if (array.length === 0) return ''
  if (array.length === 1) return array[0]
  if (isSet(sep) && !isPlainObject(sep)) return array.join(sep)
  const { separator = ', ', joiner = 'and' } = sep ?? {}
  const last = (array.pop() ?? '').trim()
  return array.map(a => (a + '').trim()).join(separator) + ` ${joiner} ${last}`
}

export default join
