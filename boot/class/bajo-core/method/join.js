import { isPlainObject } from 'lodash-es'
import isSet from './is-set.js'

function join (array, sep) {
  const isI18n = this && this.app && this.app.bajoI18N
  if (array.length === 0) return isI18n ? this.app.bajoI18N.t('none') : 'none'
  if (array.length === 1) return array[0]
  if (isSet(sep) && !isPlainObject(sep)) return array.join(sep)
  let { separator = ', ', joiner = 'and' } = sep ?? {}
  if (isI18n && this.app.bajoI18N.t) joiner = this.app.bajoI18N.t(joiner)
  const last = (array.pop() ?? '').trim()
  return array.map(a => (a + '').trim()).join(separator) + ` ${joiner} ${last}`
}

export default join
