import os from 'os'
import lodash from 'lodash'
import dayjs from 'dayjs'
import logLevels from '../lib/log-levels.js'

const { isEmpty, without, merge, upperFirst } = lodash

export function isIgnored (level) {
  const { filter, isArray } = this.lib._
  let ignore = this.app.bajo.config.log.ignore ?? []
  if (!isArray(ignore)) ignore = [ignore]
  const items = filter(ignore, i => {
    const [ns, lvl] = i.split(':')
    if (lvl) return ns === this.name && lvl === level
    return ns === this.name
  })
  return items.length > 0
}

class Log {
  constructor (plugin) {
    this.plugin = plugin
    this.format = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'
  }

  init = () => {
    this.bajoLog = this.plugin.app.bajo.config.log.logger ?? 'bajoLogger'
  }

  write = (text, ...args) => {
    return this.plugin.print.write(text, ...args)
  }

  isExtLogger = () => {
    return this.plugin.app[this.bajoLog] && this.plugin.app[this.bajoLog].logger
  }

  isIgnored = level => {
    return isIgnored.call(this.plugin, level)
  }

  child = () => {
    if (this.isExtLogger()) return this.plugin.app[this.bajoLog].logger.child()
    return this.plugin.app
  }

  formatMsg = (level, ...params) => {
    if (this.plugin.app.bajo.config.log.level === 'silent') return
    if (!this.plugin.app.bajo.isLogInRange(level)) return
    let [data, msg, ...args] = params
    if (typeof data === 'string') {
      args.unshift(msg)
      msg = data
      data = null
    }
    args = without(args, undefined)
    msg = `[${this.plugin.name}] ${this.write(msg, ...args)}`
    if (this.plugin.app[this.bajoLog] && this.plugin.app[this.bajoLog].logger) {
      this.plugin.app[this.bajoLog].logger[level](data, msg, ...args)
    } else {
      let text
      const dt = new Date()
      if (this.plugin.app.bajo.config.env === 'prod') {
        const json = { level: logLevels[level], time: dt.valueOf(), pid: process.pid, hostname: os.hostname() }
        if (!isEmpty(data)) merge(json, data)
        merge(json, { msg })
        text = JSON.stringify(json)
      } else {
        text = `[${dayjs(dt).utc(true).format(this.format)}] ${upperFirst(level)}: ${msg}`
        if (!isEmpty(data)) text += '\n' + JSON.stringify(data)
      }
      if (!this.isIgnored(level)) console.log(text)
    }
  }
}

Object.keys(logLevels).forEach(level => {
  Log.prototype[level] = function (...params) {
    this.formatMsg(level, ...params)
  }
})

export default Log
