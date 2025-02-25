import lodash from 'lodash'
import isSet from './is-set.js'

const { isPlainObject } = lodash

function join (array, sep) {
  const translate = val => {
    if (this && this.print) return this.print.write(val)
    return val
  }
  if (array.length === 0) return translate('noneL')
  if (array.length === 1) return array[0]
  if (isSet(sep) && !isPlainObject(sep)) return array.join(sep)
  let { separator = ', ', joiner = 'andL' } = sep ?? {}
  joiner = translate(joiner)
  const last = (array.pop() ?? '').trim()
  return array.map(a => (a + '').trim()).join(separator) + ` ${joiner} ${last}`
}

export default join
