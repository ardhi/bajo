import ora from 'ora'
import lodash from 'lodash'
import fs from 'fs-extra'
import Sprintf from 'sprintf-js'
const { sprintf } = Sprintf
let unknownLangWarning = false

const { isString, last, isPlainObject, get, without, reverse, map } = lodash

/**
 * Print engine. Use sprintf to interpolate pattern and variable. Support
 * many methods to display things on screen including {@link https://github.com/sindresorhus/ora|ora} based spinner.
 *
 * It also serve as the foundation of Bajo's I18n lightweight system.
 *
 * @class
 */
class Print {
  /**
   * Class constructor
   *
   * @param {Object} plugin - Plugin instance
   * @param {Object} [opts={}] - Options to pass to {@link https://github.com/sindresorhus/ora|ora}
   */
  constructor (plugin, opts = {}) {
    this.opts = opts
    this.plugin = plugin
    this.startTime = this.plugin.app.bajo.lib.dayjs()
    this.setOpts()
    this.ora = ora(this.opts)
    this.intl = {}
  }

  /**
   * Initialize print engine and read plugin's translation files
   *
   * @method
   */
  init = () => {
    for (const l of this.plugin.app.bajo.config.intl.supported) {
      this.intl[l] = {}
      const path = `${this.plugin.dir.pkg}/extend/bajo/intl/${l}.json`
      if (!fs.existsSync(path)) continue
      const trans = fs.readFileSync(path, 'utf8')
      try {
        this.intl[l] = JSON.parse(trans)
      } catch (err) {}
    }
  }

  /**
   * Interpolate and translate text according to the chosen language
   *
   * @method
   * @param {string} text - Text pattern to translate. See {@link https://github.com/alexei/sprintf.js|sprintf} for all supported token & format
   * @param {...any} [args] - Variables to interpolate with text pattern above. If the last argument is an object, it will be use to override default translation option. Example: to force language to 'id', pass the last argument as "{ lang: 'id' }"
   * @returns {string} Interpolated & translated text
   */
  write = (text, ...args) => {
    const opts = last(args)
    let lang = this.plugin.app.bajo.config.lang
    if (isPlainObject(opts)) {
      args.pop()
      if (opts.lang) lang = opts.lang
    }
    const { fallback, supported } = this.plugin.app.bajo.config.intl
    if (!unknownLangWarning && !supported.includes(lang)) {
      unknownLangWarning = true
      this.plugin.app.bajo.log.warn('unsupportedLangFallbackTo%s', fallback)
    }
    const plugins = reverse(without([...this.plugin.app.bajo.pluginNames], this.plugin.name))
    plugins.unshift(this.plugin.name)
    plugins.push('bajo')

    let trans
    for (const p of plugins) {
      const root = get(this, `plugin.app.${p}.print.intl.${lang}`, {})
      trans = get(root, text)
      if (trans) break
    }
    if (!trans) {
      for (const p of plugins) {
        const root = get(this, `plugin.app.${p}.print.intl.${fallback}`, {})
        trans = get(root, text)
        if (trans) break
      }
    }
    if (!trans) trans = text
    const params = map(args, a => {
      if (!isString(a)) return a
      return a
    })
    return sprintf(trans, ...params)
  }

  /**
   * Set spinner options
   *
   * @method
   * @param {any[]} [args=[]] - Array of options. If the last argument is an object, it will be used to override ora options
   */
  setOpts = (args = []) => {
    const config = this.plugin.app.bajo.config
    let opts = {}
    if (isPlainObject(args.slice(-1)[0])) opts = args.pop()
    this.opts.isSilent = !!(config.silent || this.opts.isSilent)
    this.opts = this.plugin.lib.aneka.defaultsDeep(opts, this.opts)
  }

  /**
   * Set spinner text
   *
   * @method
   * @param {string} text - Text to use
   * @param {...any} [args] - Any variable to interpolate text. If the last argument is an object, it will be used to override ora options
   * @returns {Object} Return itself, usefull to chain methods
   */
  setText = (text, ...args) => {
    text = this.write(text, ...args)
    this.setOpts(args)
    const prefixes = []
    const texts = []
    if (this.opts.showDatetime) prefixes.push('[' + this.plugin.app.bajo.lib.dayjs().toISOString() + ']')
    if (this.opts.showCounter) texts.push('[' + this.getElapsed() + ']')
    if (prefixes.length > 0) this.ora.prefixText = this.ora.prefixText + prefixes.join(' ')
    if (texts.length > 0) text = texts.join(' ') + ' ' + text
    this.ora.text = text
    return this
  }

  /**
   * Get elapsed time since print instance is created
   *
   * @method
   * @param {string} [unit=hms] - Unit's time. Put 'hms' (default) to get hour, minute, second format or of any format supported by {@link https://day.js.org/docs/en/display/difference|dayjs}
   * @returns {string} Elapsed time since start
   */
  getElapsed = (unit = 'hms') => {
    const u = unit === 'hms' ? 'second' : unit
    const elapsed = this.plugin.lib.dayjs().diff(this.startTime, u)
    return unit === 'hms' ? this.plugin.lib.aneka.secToHms(elapsed) : elapsed
  }

  /**
   * Start the spinner
   *
   * @method
   * @param {string} text - Text to use
   * @param {...any} [args] - Any variable to interpolate text. If the last argument is an object, it will be used to override ora options
   * @returns {Object} Return itself, usefull to chain methods
   */
  start = (text, ...args) => {
    this.setOpts(args)
    this.setText(text, ...args)
    this.ora.start()
    return this
  }

  /**
   * Stop the spinner
   *
   * @method
   * @returns {Object} Return itself, usefull to chain methods
   */
  stop = () => {
    this.ora.stop()
    return this
  }

  /**
   * Print success message, prefixed with a check icon
   *
   * @method
   * @param {string} text - Text to use
   * @param {...any} [args] - Any variable to interpolate text. If the last argument is an object, it will be used to override ora options
   * @returns {Object} Return itself, usefull to chain methods
   */
  succeed = (text, ...args) => {
    this.setText(text, ...args)
    this.ora.succeed()
    return this
  }

  /**
   * Print failed message, prefixed with a cross icon
   *
   * @method
   * @param {string} text - Text to use
   * @param {...any} [args] - Any variable to interpolate text. If the last argument is an object, it will be used to override ora options
   * @returns {Object} Return itself, usefull to chain methods
   */
  fail = (text, ...args) => {
    this.setText(text, ...args)
    this.ora.fail()
    return this
  }

  /**
   * Print warning message, prefixed with a warn icon
   *
   * @method
   * @param {string} text - Text to use
   * @param {...any} [args] - Any variable to interpolate text. If the last argument is an object, it will be used to override ora options
   * @returns {Object} Return itself, usefull to chain methods
   */
  warn = (text, ...args) => {
    this.setText(text, ...args)
    this.ora.warn()
    return this
  }

  /**
   * Print failed message, prefixed with an info icon
   *
   * @method
   * @param {string} text - Text to use
   * @param {...any} [args] - Any variable to interpolate text. If the last argument is an object, it will be used to override ora options
   * @returns {Object} Return itself, usefull to chain methods
   */
  info = (text, ...args) => {
    this.setText(text, ...args)
    this.ora.info()
    return this
  }

  /**
   * Clear spinner text
   *
   * @method
   * @returns {Object} Return itself, usefull to chain methods
   */
  clear = () => {
    this.ora.clear()
    return this
  }

  /**
   * Force render spinner
   *
   * @method
   * @returns {Object} Return itself, usefull to chain methods
   */
  render = () => {
    this.ora.render()
    return this
  }

  /**
   * Print failed message, prefixed with a cross icon and terminate the app process
   *
   * @method
   * @param {string} text - Text to use
   * @param {...any} [args] - Any variable to interpolate text. If the last argument is an object, it will be used to override ora options
   */
  fatal = (text, ...args) => {
    this.setText(text, ...args)
    this.ora.fail()
    process.kill(process.pid, 'SIGINT')
  }

  /**
   * Create a new spinner
   *
   * @method
   * @returns {Object} Return new instance
   */
  spinner = () => {
    return new Print(this.plugin)
  }
}

export default Print
