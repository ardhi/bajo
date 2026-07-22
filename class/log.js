import os from 'os'
import chalk from 'chalk'
import { stripVTControlCharacters } from 'node:util'

/**
 * @typedef {Object} TLevels
 * @memberof Log
 * @type {Object}
 * @property {Object} trace
 * @property {number} [trace.number=10]
 * @property {string} [trace.color=gray]
 * @property {Object} debug
 * @property {number} [debug.number=20]
 * @property {string} [debug.color=greenBright]
 * @property {Object} info
 * @property {number} [info.number=30]
 * @property {string} [info.color=blueBright]
 * @property {Object} warn
 * @property {number} [warn.number=40]
 * @property {string} [warn.color=yellowBright]
 * @property {Object} error
 * @property {number} [error.number=50]
 * @property {string} [error.color=redBright]
 * @property {Object} fatal
 * @property {number} [fatal.number=60]
 * @property {string} [fatal.color=magentaBright]
 * @property {Object} silent
 * @property {number} [silent.number=99]
 * @property {string} [silent.color=white]
*/

export const logLevels = {
  trace: { number: 10, color: 'gray' },
  debug: { number: 20, color: 'greenBright' },
  info: { number: 30, color: 'blueBright' },
  warn: { number: 40, color: 'yellowBright' },
  error: { number: 50, color: 'redBright' },
  fatal: { number: 60, color: 'magentaBright' },
  silent: { number: 99, color: 'white' }
}

/**
 * Log output in stringified JSON format. Returned when app run in `prod` environment.
 *
 * @typedef TJsonOutput
 * @memberof Log
 * @property {string} prefix Message prefix.
 * @property {string} message The message itself.
 * @property {string} level Log level.
 * @property {number} time Time in millisecond.
 * @property {number} pid Process ID.
 * @property {string} hostname Hostname.
 * @property {Object} [data] Payload data, if any.
 * @see Log#formatMsg
 */

/**
 * A thin & fast logger system.
 *
 * You typically don't need to create an instance of this class, since an instance is already created by the {@link App|app}
 * and available to use from anywhere inside your code.
 *
 * Shortcuts to log's methods are also available on every Bajo {@link Plugin|plugin}. Call on
 * these shortcuts will be prefixed with it's plugin name automatically.
 *
 * Example:
 * ```js
 * // ... anywhere inside your code
 * this.app.log.debug(...)
 * // or inside a plugin
 * if (!isValid) this.log.error('Invalid value!') // will be prefixed with plugin namespace automatically
 * ```
 *
 * @class
 */
class Log {
  /**
   * Constructor.
   * @param {App} app - App instance
   */
  constructor (app) {
    const { fs } = this.app.lib
    /**
     * Last delta time in millisecond since app started. Used for log's time taken feature.
     * @type {number}
     */
    this._lastDelta = 0
    /**
     * Reference to the app instance
     * @type {App}
     */
    this.app = app

    /**
     * Directory to save log files. Defaults to `{dataDir}/log`. If log saving is on (see {@link App#config|app.config.log.save})
     * and directory does not exist, this directory will be created automatically.
     * @type {string}
     */
    this.logDir = `${this.app.bajo.dir.data}/log`
    if (this.app.bajo.config.log.save) fs.ensureDirSync(this.logDir)
  }

  /**
   * Format & display log message according to the current log level with the following syntax:
   * 1. `level` `prefix` `text` `param 1` `param 2` `...param n` - Translate `text` and interpolate with `params` for level `level`
   * 2. `level` `prefix` `{data}` `text` `param 1` `param 2` `...param n` - Same as above, but with additional stringified `data` object to be logged
   * 3. `level` `prefix` `{error}` - Format as {@link Err} object. If current log level is **trace**, dump it on screen
   *
   * In `prod` environment, log will be delivered as JSON stringified object. See {@link Log.TJsonOutput} for more info
   *
   * @method
   * @param {string} level - Log level to use
   * @param {string} prefix - Prefix to the message
   * @param {...*} params - See format above
   * @see Err
   * @see Log.TJsonOutput
   */
  formatMsg = (level, prefix, ...args) => {
    const { dayjs } = this.app.lib
    const { isEmpty, merge, without } = this.app.lib._

    if (this.app.bajo.config.log.level === 'silent') return
    if (!this.app.bajo.isLogInRange(level)) return
    const { useUtc, timeTaken, dateFormat, pretty } = this.app.bajo.config.log
    let [data, msg, ...params] = args
    if (data instanceof Error) {
      msg = 'error%s'
      params = [this.getErrorMessage(data)]
      console.error(data)
    }
    if (typeof data === 'string') {
      params.unshift(msg)
      msg = data
      data = null
    }
    params = without(params, undefined)
    msg = this.app.t(prefix, msg, ...params)
    let text
    const dt = dayjs()
    let diff = null
    if (timeTaken) {
      const delta = dt.diff(this.app.runAt, 'ms')
      diff = delta - this._lastDelta
      this._lastDelta = delta
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

  /**
   * Get error message from an Error object. If the error message is empty, return the error code or status code instead.
   * @method
   * @param {Error} error - Error object
   * @returns {string} Error message
   */
  getErrorMessage = error => {
    const { isEmpty } = this.app.lib._
    return isEmpty(error.message) ? (error.code ?? error.statusCode) : error.message
  }

  /**
   * Calculate pattern used for log rotation. Used by {@link Log#save|save} method to determine the log file name.
   * Rotation pattern is based on the `rotation.cycle` configuration. See {@link App#config|app.config.log.rotation.cycle} for more info.
   *
   * @method
   * @param {boolean} isPrev - If `true`, calculate previous rotation pattern.
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
   * Save log to file in {@link Log#logDir|logDir}.
   *
   * @method
   * @param {string} text - Log message to save
   * @param {string} [prefix='bajo'] - Use prefix as basename. Defaults to `bajo`
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
   * Display & format message in `trace` level. See {@link Log#formatMsg|formatMsg} for details.
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...*} args - Argumets to be passed to the message. See {@link Log#formatMsg|formatMsg} for details.
   * @see Err
   * @see Log.TJsonOutput
   */
  trace = (prefix, ...args) => {
    this.formatMsg('trace', prefix, ...args)
  }

  /**
   * Display & format message in `debug` level. See {@link Log#formatMsg|formatMsg} for details.
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...*} args - Arguments to be passed to the message. See {@link Log#formatMsg|formatMsg} for details.
   */
  debug = (prefix, ...args) => {
    this.formatMsg('debug', prefix, ...args)
  }

  /**
   * Display & format message in `info` level. See {@link Log#formatMsg|formatMsg} for details.
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...*} args - Arguments to be passed to the message. See {@link Log#formatMsg|formatMsg} for details.
   */
  info = (prefix, ...args) => {
    this.formatMsg('info', prefix, ...args)
  }

  /**
   * Display & format message in `warn` level. See {@link Log#formatMsg|formatMsg} for details.
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...*} args - Arguments to be passed to the message. See {@link Log#formatMsg|formatMsg} for details.
   */
  warn = (prefix, ...args) => {
    this.formatMsg('warn', prefix, ...args)
  }

  /**
   * Display & format message in `error` level. See {@link Log#formatMsg|formatMsg} for details.
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...*} args - Arguments to be passed to the message. See {@link Log#formatMsg|formatMsg} for details.
   */
  error = (prefix, ...args) => {
    this.formatMsg('error', prefix, ...args)
  }

  /**
   * Display & format message in `fatal` level. See {@link Log#formatMsg|formatMsg} for details.
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...*} args - Arguments to be passed to the message. See {@link Log#formatMsg|formatMsg} for details.
   */
  fatal = (prefix, ...args) => {
    this.formatMsg('fatal', prefix, ...args)
  }

  /**
   * Display & format message in `silent` level. See {@link Log#formatMsg|formatMsg} for details.
   *
   * @method
   * @param {string} prefix - Message prefix
   * @param {...*} args - Arguments to be passed to the message. See {@link Log#formatMsg|formatMsg} for details.
   */
  silent = (prefix, ...args) => {
    this.formatMsg('silent', prefix, ...args)
  }

  /**
   * Dispose internal references.
   *
   * @async
   * @method
   * @returns {Promise<void>}
   */
  dispose = async () => {
    this.app = null
  }
}

export default Log
