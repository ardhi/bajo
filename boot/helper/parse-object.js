import { isPlainObject, isArray, isNumber, set, cloneDeep } from 'lodash-es'
import dotenvParseVariables from 'dotenv-parse-variables'
import ms from 'ms'
import dayjs from '../lib/dayjs.js'
import isSet from './is-set.js'

const statics = ['*']

function parseDur (val) {
  return isNumber(val) ? val : ms(val)
}

function parseDt (val) {
  const dt = dayjs(val)
  if (!dt.isValid()) throw Error(`Unparsed date/time '${val}'`)
  return dt.toDate()
}

function parseObject (input, silent = true, parseValue = false) {
  const obj = cloneDeep(input)
  const keys = Object.keys(obj)
  keys.forEach(k => {
    const v = obj[k]
    if (isPlainObject(v)) obj[k] = parseObject(v)
    else if (isArray(v)) {
      v.forEach((i, idx) => {
        if (isPlainObject(i)) obj[k][idx] = parseObject(i)
        else if (statics.includes(i)) obj[k][idx] = i
        else if (parseValue) obj[k][idx] = dotenvParseVariables(set({}, 'item', obj[k][idx]), { assignToProcessEnv: false }).item
        if (isArray(obj[k][idx])) obj[k][idx] = obj[k][idx].map(item => typeof item === 'string' ? item.trim() : item)
      })
    } else if (isSet(v)) {
      try {
        if (statics.includes(v)) obj[k] = v
        else if (parseValue) {
          obj[k] = dotenvParseVariables(set({}, 'item', v), { assignToProcessEnv: false }).item
          if (isArray(obj[k])) obj[k] = obj[k].map(item => typeof item === 'string' ? item.trim() : item)
        }
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
