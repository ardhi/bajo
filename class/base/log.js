import os from 'os'
import lodash from 'lodash'
import dayjs from 'dayjs'
import logLevels from '../../lib/log-levels.js'
import chalk from 'chalk'

const { isEmpty, without, merge } = lodash

/**
 * Log output in stringified JSON format. Returned when app run in ```prod``` environment
 *
 * @typedef TLogJson
 * @property {string} prefix - Message prefix
 * @property {string} message - The message itself
 * @property {string} level - Log level
 * @property {number} time - Time in millisecond
 * @property {number} pid - Process ID
 * @property {string} hostname - Hostname
 * @property {Object} [data] - Payload data, if any
 * @see Log#formatMsg
 */

/**
 * A thin & fast logger system.
 *
 * An instance is created by the {@link App|app} and available to use anywhere like this:
 *
 * ```javascript
 * ... anywhere inside your code
 * this.app.log.debug(...)
 * ```
 *
 * Shortcuts to log's methods are also available on every Bajo {@link BasePlugin|plugin}. Call on
 * these shortcuts will be prefixed with it's plugin name automatically:
 *
 * ```javascript
 * ... anywhere inside your code
 * if (!isValid) this.log.error('Invalid value!')
 * ```
 *
 * @class
 */
class Log {
  /**
   * @param {App} app - App instance
   */
  constructor (app) {
    /**
     * The app instance
     * @type {App}
     */
    this.app = app

    /**
     * Date format to use in {@link https://day.js.org/docs/en/parse/string-format|dayjs} format. See {@tutorial config} for more info.
     * @type {string}
     */
    const { dateFormat } = this.app.bajo.config.log ?? {}
    this.dateFormat = dateFormat ?? 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'
  }

  /**
   * Display & format message according to one of these rules:
   * 1. ```level``` ```prefix``` ```text``` ```var 1``` ```var 2``` ```...var n``` - Translate ```text``` and interpolate with ```vars``` for level ```level```
   * 2. ```level``` ```prefix``` ```data``` ```text``` ```var 1``` ```var 2``` ```...var n``` - As above, and append stringified ```data```
   * 3. ```level``` ```prefix``` ```error``` - Format as {@link Err} object. If current log level is _trace_, dump it on screen
   *
   * In ```prod``` environment, log will be delivered as JSON stringified object. See {@link TLogJson} for more info
   *
   * @method
   * @param {string} level - Log level to use
   * @param {string} prefix - Prefix to the message
   * @param {...any} params - See format above
   * @see Err
   * @see TLogJson
   */
  formatMsg = (level, prefix, ...params) => {
    if (this.app.bajo.config.log.level === 'silent') return
    if (!this.app.bajo.isLogInRange(level)) return
    const pretty = this.app.bajo.config.log.pretty
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
    msg = this.app.t(prefix, msg, ...args)
    let text
    const dt = new Date()
    if (this.app.bajo.config.env === 'prod') {
      const json = { prefix, msg, level: logLevels[level].number, time: dt.valueOf(), pid: process.pid, hostname: os.hostname() }
      if (!isEmpty(data)) merge(json, { data })
      text = JSON.stringify(json)
    } else {
      const date = dayjs(dt).utc(true).format(this.dateFormat)
      const tdate = pretty ? chalk.cyan(date) : `[${date}]`
      const tlevel = pretty ? `${chalk[logLevels[level].color](level.toUpperCase())}:` : `[${level.toUpperCase()}]`
      const tprefix = pretty ? chalk.bgBlue(`${prefix}`) : `[${prefix}]`
      text = `${tdate} ${tlevel} ${tprefix} ${msg}`
      if (!isEmpty(data)) text += '\n' + JSON.stringify(data)
    }
    console.log(text)
    if (data instanceof Error && level === 'trace') console.error(data)
  }

  /**
   * Display & format message in ```trace``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...any} params - Parameters
   */
  trace = (prefix, ...params) => {
    this.formatMsg('trace', prefix, ...params)
  }

  /**
   * Display & format message in ```debug``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...any} params - Parameters
   */
  debug = (prefix, ...params) => {
    this.formatMsg('debug', prefix, ...params)
  }

  /**
   * Display & format message in ```info``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...any} params - Parameters
   */
  info = (prefix, ...params) => {
    this.formatMsg('info', prefix, ...params)
  }

  /**
   * Display & format message in ```warn``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...any} params - Parameters
   */
  warn = (prefix, ...params) => {
    this.formatMsg('warn', prefix, ...params)
  }

  /**
   * Display & format message in ```error``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...any} params - Parameters
   */
  error = (prefix, ...params) => {
    this.formatMsg('error', prefix, ...params)
  }

  /**
   * Display & format message in ```fatal``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...any} params - Parameters
   */
  fatal = (prefix, ...params) => {
    this.formatMsg('fatal', prefix, ...params)
  }

  /**
   * Display & format message in ```silent``` level. See {@link Log#formatMsg|formatMsg} for details
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...any} params - Parameters
   */
  silent = (prefix, ...params) => {
    this.formatMsg('silent', prefix, ...params)
  }
}

export default Log
