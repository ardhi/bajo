import { isPlainObject, isArray, isNumber, set } from 'lodash-es'
import dotenvParseVariables from 'dotenv-parse-variables'
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

function parseObject (obj, silent = true, parseValue = false) {
  const keys = Object.keys(obj)
  keys.forEach(k => {
    const v = obj[k]
    if (isPlainObject(v)) obj[k] = parseObject(v)
    else if (isArray(v)) {
      v.forEach((i, idx) => {
        if (isPlainObject(i)) obj[k][idx] = parseObject(i)
        else if (parseValue) obj[k][idx] = dotenvParseVariables(set({}, 'item', obj[k][idx]), { assignToProcessEnv: false }).item
      })
    } else if (isSet(v)) {
      try {
        if (parseValue) obj[k] = dotenvParseVariables(set({}, 'item', v), { assignToProcessEnv: false }).item
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
