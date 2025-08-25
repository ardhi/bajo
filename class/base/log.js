import os from 'os'
import lodash from 'lodash'
import dayjs from 'dayjs'
import logLevels from '../../lib/log-levels.js'
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

/**
 * A thin logger system.
 *
 * @class
 */
class Log {
  /**
   * @param {Object} plugin - Plugin instance
   */
  constructor (plugin) {
    this.plugin = plugin
    this.app = plugin.app
    this.format = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'
  }

  /**
   * Initialize logger. Auto detect to use different logger via Bajo's config file
   *
   * @method
   */
  init = () => {
    this.bajoLog = this.plugin.app.bajo.config.log.logger ?? 'bajoLogger'
  }

  /**
   * Interpolate and translate text via plugin's print engine. Check Print class
   * for more information
   *
   * @method
   * @param {string} text - Text pattern to use
   * @param {...any} [args] - Variables to interpolate with text pattern above
   * @returns {string} Interpolated & translated text
   */
  write = (text, ...args) => {
    return this.plugin.print.write(text, ...args)
  }

  /**
   * Do we use external logger or Bajo's built-in one?
   *
   * @method
   * @returns {boolean}
   */
  isExtLogger = () => {
    return !!(this.plugin.app[this.bajoLog] && this.plugin.app[this.bajoLog].logger)
  }

  /**
   * Is provided level being ignored by config?
   *
   * @method
   * @param {string} level - Log level
   * @returns {boolean}
   */
  isIgnored = level => {
    return isIgnored.call(this.plugin, level)
  }

  /**
   * Create child logger
   *
   * @method
   * @returns {Object} Child logger instance
   */
  child = () => {
    if (this.isExtLogger()) return this.plugin.app[this.bajoLog].logger.child()
    return this.plugin.app
  }

  /**
   * Display & format message according to one of these rules:
   * 1. ```level``` ```text``` ```var 1``` ```var 2``` ```...var n``` - Translate ```text``` and interpolate with ```vars``` for level ```level```
   * 2. ```level``` ```data``` ```text``` ```var 1``` ```var 2``` ```...var n``` - As above, and append stringified ```data```
   * 3. ```level``` ```error``` - Format as **error**. If current log level is _trace_, dump the error object on screen
   *
   * @method
   * @param {string} level - Log level to use
   * @param {...any} params - See format above
   */
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

  /**
   * Display & format message as ```trace``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param  {...any} params
   */
  trace = (...params) => {
    this.formatMsg('trace', ...params)
  }

  /**
   * Display & format message as ```debug``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param  {...any} params
   */
  debug = (...params) => {
    this.formatMsg('debug', ...params)
  }

  /**
   * Display & format message as ```info``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param  {...any} params
   */
  info = (...params) => {
    this.formatMsg('info', ...params)
  }

  /**
   * Display & format message as ```warn``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param  {...any} params
   */
  warn = (...params) => {
    this.formatMsg('warn', ...params)
  }

  /**
   * Display & format message as ```error``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param  {...any} params
   */
  error = (...params) => {
    this.formatMsg('error', ...params)
  }

  /**
   * Display & format message as ```fatal``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param  {...any} params
   */
  fatal = (...params) => {
    this.formatMsg('fatal', ...params)
  }

  silent = (...params) => {
    this.formatMsg('silent', ...params)
  }
}

export default Log
