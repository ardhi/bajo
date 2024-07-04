import os from 'os'
import Sprintf from 'sprintf-js'
import { isEmpty, without, merge, upperFirst, isPlainObject, get } from 'lodash-es'
import levels from '../helper/log-levels.js'
import isLogInRange from '../helper/is-log-in-range.js'
import dayjs from 'dayjs'

const { sprintf } = Sprintf

class Log {
  constructor (parent) {
    this.parent = parent
    this.format = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'
  }

  init () {
    this.bajoLog = get(this.parent.app.bajo, 'config.log.logger', 'bajoLogger')
  }

  print (text, ...args) {
    if (text) {
      const i18n = get(this.parent, 'app.bajoI18N.instance')
      if (i18n) {
        if (isPlainObject(args[0])) text = i18n.t(text, args[0])
        else text = i18n.t(text, { ns: this.parent.name, postProcess: 'sprintf', sprintf: args })
      } else text = sprintf(text, ...args)
    }
    return text
  }

  isExtLogger () {
    return this.parent.app[this.bajoLog] && this.parent.app[this.bajoLog].logger
  }

  child () {
    if (this.isExtLogger()) return this.parent.app[this.bajoLog].logger.child()
    return this.parent.app
  }

  formatMsg (level, ...params) {
    if (this.parent.app.bajo.config.log.level === 'silent') return
    if (!isLogInRange.call(this.parent.app.bajo, level)) return
    let [data, msg, ...args] = params
    if (typeof data === 'string') {
      args.unshift(msg)
      msg = data
      data = null
    }
    args = without(args, undefined)
    msg = this.print(`[%s] ${msg}`, this.parent.name, ...args)
    if (this.parent.app[this.bajoLog] && this.parent.app[this.bajoLog].logger) {
      this.parent.app[this.bajoLog].logger[level](data, msg, ...args)
    } else {
      let text
      const dt = new Date()
      if (this.parent.app.bajo.config.env === 'prod') {
        const json = { level: levels[level], time: dt.valueOf(), pid: process.pid, hostname: os.hostname() }
        if (!isEmpty(data)) merge(json, data)
        merge(json, { msg })
        text = JSON.stringify(json)
      } else {
        text = `[${dayjs(dt).utc(true).format(this.format)}] ${upperFirst(level)}: ${msg}`
        if (!isEmpty(data)) text += '\n' + JSON.stringify(data)
      }
      console.log(text)
    }
  }
}

Object.keys(levels).forEach(level => {
  Log.prototype[level] = function (...params) {
    this.formatMsg(level, ...params)
  }
})

export default Log
