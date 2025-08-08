import os from 'os'
import lodash from 'lodash'
import dayjs from 'dayjs'
import logLevels from '../lib/log-levels.js'
import chalk from 'chalk'

const { isEmpty, without, merge } = lodash

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
    const plain = this.plugin.app.bajo.config.log.plain
    let [data, msg, ...args] = params
    if (typeof data === 'string') {
      args.unshift(msg)
      msg = data
      data = null
    }
    args = without(args, undefined)
    if (data instanceof Error) {
      msg = 'error%s'
      args = [data.message]
    }
    msg = this.write(msg, ...args)
    if (this.plugin.app[this.bajoLog] && this.plugin.app[this.bajoLog].logger) {
      this.plugin.app[this.bajoLog].logger[level](data, `[${this.plugin.name}] ${msg}`, ...args)
    } else {
      let text
      const dt = new Date()
      if (this.plugin.app.bajo.config.env === 'prod') {
        const json = { level: logLevels[level].number, time: dt.valueOf(), pid: process.pid, hostname: os.hostname() }
        if (!isEmpty(data)) merge(json, data)
        merge(json, { msg: `[${this.plugin.name}] ${msg}` })
        text = JSON.stringify(json)
      } else {
        const date = dayjs(dt).utc(true).format(this.format)
        const tdate = plain ? `[${date}]` : chalk.cyan(date)
        const tlevel = plain ? level.toUpperCase() : chalk[logLevels[level].color](level.toUpperCase())
        const tplugin = plain ? `[${this.plugin.name}]` : chalk.bgBlue(`${this.plugin.name}`)
        text = `${tdate} ${tlevel}: ${tplugin} ${msg}`
        if (!isEmpty(data)) text += '\n' + JSON.stringify(data)
      }
      if (!this.isIgnored(level)) {
        console.log(text)
        if (data instanceof Error && level === 'trace') console.error(data)
      }
    }
  }
}

Object.keys(logLevels).forEach(level => {
  Log.prototype[level] = function (...params) {
    this.formatMsg(level, ...params)
  }
})

export default Log
