import os from 'os'
import logLevels from '../../lib/log-levels.js'
import chalk from 'chalk'
import { stripVTControlCharacters } from 'node:util'

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
 * Shortcuts to log's methods are also available on every Bajo {@link Plugin|plugin}. Call on
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
    this.lastDelta = 0
    /**
     * The app instance
     * @type {App}
     */
    this.app = app

    const { fs } = this.app.lib
    this.logDir = `${this.app.bajo.dir.data}/log`
    if (this.app.bajo.config.log.save) fs.ensureDirSync(this.logDir)
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
    const { dayjs } = this.app.lib
    const { isEmpty, merge, without } = this.app.lib._

    if (this.app.bajo.config.log.level === 'silent') return
    if (!this.app.bajo.isLogInRange(level)) return
    const { useUtc, timeTaken, dateFormat, pretty } = this.app.bajo.config.log
    let [data, msg, ...args] = params
    if (data instanceof Error) {
      msg = 'error%s'
      args = [this.getErrorMessage(data)]
      console.error(data)
    }
    if (typeof data === 'string') {
      args.unshift(msg)
      msg = data
      data = null
    }
    args = without(args, undefined)
    msg = this.app.t(prefix, msg, ...args)
    let text
    const dt = dayjs()
    let diff = null
    if (timeTaken) {
      const delta = dt.diff(this.app.runAt, 'ms')
      diff = delta - this.lastDelta
      this.lastDelta = delta
    }
    if (this.app.bajo.config.env === 'prod') {
      const json = { prefix, msg, level: logLevels[level].number, time: dt.valueOf(), pid: process.pid, hostname: os.hostname() }
      if (!isEmpty(data)) merge(json, { data })
      if (timeTaken) merge(json, { timeTaken: diff })
      text = JSON.stringify(json)
    } else {
      let date = dt.clone()
      if (useUtc) date = dayjs.utc(dt)
      date = date.format(dateFormat)
      let tdate = pretty ? chalk.cyan(date) : `[${date}]`
      if (timeTaken) {
        const tdiff = pretty ? chalk.cyan(`+${diff}ms`) : `[+${diff}ms]`
        tdate += ` ${tdiff}`
      }
      const tlevel = pretty ? `${chalk[logLevels[level].color](level.toUpperCase())}:` : `[${level.toUpperCase()}]`
      const tprefix = pretty ? chalk.bgBlue(`${prefix}`) : `[${prefix}]`
      text = `${tdate} ${tlevel} ${tprefix} ${msg}`
      if (!isEmpty(data) && !(data instanceof Error)) text += '\n' + JSON.stringify(data)
    }
    console.log(text)
    if (this.app.bajo.config.log.save) this.save(text, prefix)
  }

  getErrorMessage = error => {
    const { isEmpty } = this.app.lib._
    return isEmpty(error.message) ? (error.code ?? error.statusCode) : error.message
  }

  /**
   * Calculate pattern used for log rotation
   *
   * @method
   * @param {boolean} isPrev - If true, calculate previous rotation pattern
   * @returns {string} Calculated pattern
   */
  getRotationPattern = (isPrev) => {
    const { dayjs } = this.app.lib
    const { cycle } = this.app.bajo.config.log.rotation
    if (cycle === 'none') return
    let pattern
    const now = dayjs()
    switch (cycle) {
      case 'monthly': {
        const dt = isPrev ? now.subtract(1, 'month') : now
        pattern = dt.format('YYYY-MM')
        break
      }
      case 'weekly': {
        const dt = isPrev ? now.subtract(1, 'week') : now
        pattern = dt.format(`YYYY-W${dt.week()}`)
        break
      }
      case 'daily': {
        const dt = isPrev ? now.subtract(1, 'day') : now
        pattern = dt.format('YYYY-MM-DD')
        break
      }
    }
    return pattern
  }

  /**
   * Save log to file in {dataDir}/log
   *
   * @method
   * @param {string} text - Log message to save
   * @param {string} prefix - Use prefix as basename. Defaults to 'bajo'
   */
  save = (text, prefix = 'bajo') => {
    const { fs } = this.app.lib
    const fname = this.app.bajo.config.log.rotation.byPlugin ? prefix : 'bajo'
    let file = `${this.logDir}/${fname}.log`
    const content = stripVTControlCharacters(text)
    const pattern = this.getRotationPattern()
    if (pattern) {
      file = `${this.logDir}/${fname}.${pattern}.log`
    }
    fs.appendFileSync(file, `${content}\n`, 'utf8')
    // TODO: symlink bajo.log to target
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

  /**
   * Dispose internal references
   */
  dispose = () => {
    this.app = null
  }
}

export default Log
