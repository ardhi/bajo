import { isPlainObject } from 'lodash-es'
import isSet from './is-set.js'

function join (array, sep) {
  if (array.length === 0) return ''
  if (array.length === 1) return array[0]
  if (isSet(sep) && !isPlainObject(sep)) return array.join(sep)
  let { separator = ', ', joiner = 'and' } = sep ?? {}
  if (this && this.app && this.app.bajoI18N) joiner = this.app.bajoI18N.t(joiner)
  const last = (array.pop() ?? '').trim()
  return array.map(a => (a + '').trim()).join(separator) + ` ${joiner} ${last}`
}

export default join
