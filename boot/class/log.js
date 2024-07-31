import os from 'os'
import { isEmpty, without, merge, upperFirst } from 'lodash-es'
import levels from './bajo-core/method/log-levels.js'
import isLogInRange from './bajo-core/method/is-log-in-range.js'
import translate from '../lib/translate.js'
import dayjs from 'dayjs'

class Log {
  constructor (plugin) {
    this.plugin = plugin
    this.format = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'
  }

  init () {
    this.bajoLog = this.plugin.app.bajo.config.log.logger ?? 'bajoLogger'
  }

  write (text, ...args) {
    return translate.call(this.plugin, null, text, ...args)
  }

  isExtLogger () {
    return this.plugin.app[this.bajoLog] && this.plugin.app[this.bajoLog].logger
  }

  child () {
    if (this.isExtLogger()) return this.plugin.app[this.bajoLog].logger.child()
    return this.plugin.app
  }

  formatMsg (level, ...params) {
    if (this.plugin.app.bajo.config.log.level === 'silent') return
    if (!isLogInRange.call(this.plugin.app.bajo, level)) return
    let [data, msg, ...args] = params
    if (typeof data === 'string') {
      args.unshift(msg)
      msg = data
      data = null
    }
    args = without(args, undefined)
    msg = this.write(`[%s] ${msg}`, this.plugin.name, ...args)
    if (this.plugin.app[this.bajoLog] && this.plugin.app[this.bajoLog].logger) {
      this.plugin.app[this.bajoLog].logger[level](data, msg, ...args)
    } else {
      let text
      const dt = new Date()
      if (this.plugin.app.bajo.config.env === 'prod') {
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
