import { isPlainObject, isArray, isNumber } from 'lodash-es'
import ms from 'ms'
import dayjs from '../lib/dayjs.js'
import isSet from './is-set.js'

function parseDur (val) {
  return isNumber(val) ? val : ms(val)
}

function parseDt (val) {
  const dt = dayjs(val)
  if (!dt.isValid()) throw Error(`Unparsed date/time '${val}'`)
  return dt.toDate()
}

function parseObject (obj, silent = true) {
  const keys = Object.keys(obj)
  keys.forEach(k => {
    const v = obj[k]
    if (isPlainObject(v)) obj[k] = parseObject(v)
    else if (isArray(v)) {
      v.forEach((i, idx) => {
        if (isPlainObject(i)) obj[k][idx] = parseObject(i)
      })
    } else if (isSet(v)) {
      try {
        if (k.slice(-3) === 'Dur') obj[k] = parseDur(v)
        if (k.slice(-2) === 'Dt') obj[k] = parseDt(v)
      } catch (err) {
        obj[k] = undefined
        if (!silent) throw err
      }
    }
  })
  return obj
}

export default parseObject
