import { isPlainObject, isArray, isNumber, set, cloneDeep, isString, omit } from 'lodash-es'
import dotenvParseVariables from 'dotenv-parse-variables'
import ms from 'ms'
import dayjs from '../../../lib/dayjs.js'
import isSet from './is-set.js'
import translate from '../../../lib/translate.js'

const statics = ['*']

function parseDur (val) {
  return isNumber(val) ? val : ms(val)
}

function parseDt (val) {
  const dt = dayjs(val)
  if (!dt.isValid()) throw this.error('Unparsed date/time \'%s\'', val)
  return dt.toDate()
}

function parseObject (input, { silent = true, parseValue = false, i18n, plugin } = {}) {
  let obj = cloneDeep(input)
  const keys = Object.keys(obj)
  const me = this
  const translated = []
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
        else if (i18n && k.startsWith('t:') && isString(v)) {
          const scope = plugin ?? me
          let [text, ...args] = v.split('|')
          args = args.map(a => {
            if (a.slice(0, 2) === 't:') a = translate.call(scope, i18n, a.slice(2))
            return a
          })
          obj[k.slice(2)] = translate.call(scope, i18n, text, ...args)
          translated.push(k)
        } else if (parseValue) {
          obj[k] = dotenvParseVariables(set({}, 'item', v), { assignToProcessEnv: false }).item
          if (isArray(obj[k])) obj[k] = obj[k].map(item => typeof item === 'string' ? item.trim() : item)
        }
        if (k.slice(-3) === 'Dur') obj[k] = parseDur.call(me, v)
        if (k.slice(-2) === 'Dt') obj[k] = parseDt.call(me, v)
      } catch (err) {
        obj[k] = undefined
        if (!silent) throw err
      }
    }
  })
  if (translated.length > 0) obj = omit(obj, translated)
  return obj
}

export default parseObject
