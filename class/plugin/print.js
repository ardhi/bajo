import ora from 'ora'
import lodash from 'lodash'
import defaultsDeep from 'aneka/src/defaults-deep.js'
import secToHms from 'aneka/src/sec-to-hms.js'
import Tools from './tools.js'

const { isPlainObject } = lodash

/**
 * @typedef TPrintOptions
 * @property {boolean} [showDatetime=false] - Show actual date & time
 * @property {boolean} [showCounter=false] - Show as counter
 * @property {boolean} [silent] - Suppress any messages. Defaults to the one set in {@tutorial config}
 * @property {Object} [ora] - {@link https://github.com/sindresorhus/ora#api|Ora's options} object
 * @see {@link Print}
 */

/**
 * Universal print engine, supports text translation using {@link App#t|app's built-in translation}.
 *
 * Features many methods to display things on screen/console using {@link https://github.com/sindresorhus/ora|ora}
 * based spinner.
 *
 * @class
 */
class Print extends Tools {
  /**
   * @param {Plugin} plugin - Plugin instance
   * @param {TPrintOptions} [options={}] - Options object
   */
  constructor (plugin, options = {}) {
    super(plugin)

    /**
     * Options object
     * @type {TPrintOptions}
     */
    this.options = options
    if (this.app.applet) {
      if (this.app.bajo.config.counter) this.options.showCounter = true
      if (this.app.bajo.config.datetime) this.options.showDatetime = true
    }

    /**
     * Time when instance is created
     * @type {Object}
     * @see {@link https://day.js.org|dayjs} &nbsp;object
     */
    this.startTime = this.app.lib.dayjs()

    /**
     * ora instance
     * @see {@link https://github.com/sindresorhus/ora|ora}
     */
    this.ora = ora(this.options.ora)
    this.setOpts()
  }

  /**
   * Setting spinner options; override the one passed at constructor
   *
   * @method
   * @param {any[]} [args=[]] - Array of options. If the last argument is an object, it will be used to override ora options
   */
  setOpts = (args = []) => {
    const { silent } = this.app.bajo.config
    let opts = {}
    if (isPlainObject(args.slice(-1)[0])) opts = args.pop()
    this.options.silent = !!(silent || this.options.silent)
    this.options = defaultsDeep(opts, this.options)
  }

  /**
   * Translate, prefixed with counter and/or datetime etc
   *
   * @param {string} text - Text to use
   * @param {...any} [args] - Any variable to interpolate text. If the last argument is an object, it will be used to override ora's options
   * @returns {string}
   */
  buildText = (text, ...args) => {
    text = this.plugin.t(text, ...args)
    this.setOpts(args)
    const prefixes = []
    if (this.options.showDatetime) prefixes.push('[' + this.app.lib.dayjs().toISOString() + ']')
    if (this.options.showCounter) prefixes.push('[' + this.getElapsed() + ']')
    // if (prefixes.length > 0) this.ora.prefixText = this.ora.prefixText + prefixes.join(' ')
    if (prefixes.length > 0) text = prefixes.join(' ') + ' ' + text
    return text
  }

  /**
   * Set spinner's text
   *
   * @method
   * @param {string} text - Text to use
   * @param {...any} [args] - Any variable to interpolate text. If the last argument is an object, it will be used to override ora's options
   * @returns {Print} Return the instance itself, usefull for method chaining
   */
  setText = (text, ...args) => {
    text = this.buildText(text, ...args)
    this.ora.text = text
    return this
  }

  /**
   * Get elapsed time since instance is created
   *
   * @method
   * @param {string} [unit=hms] - Unit's time. Put 'hms' (default) to get hour, minute, second format or of any format supported by {@link https://day.js.org/docs/en/display/difference|dayjs}
   * @returns {string} Elapsed time since start
   * @see {@link https://day.js.org/docs/en/display/difference|dayjs duration format}
   */
  getElapsed = (unit = 'hms') => {
    const u = unit === 'hms' ? 'second' : unit
    const elapsed = this.app.lib.dayjs().diff(this.startTime, u)
    return unit === 'hms' ? secToHms(elapsed) : elapsed
  }

  /**
   * Start the spinner
   *
   * @method
   * @param {string} text - Text to use
   * @param {...any} [args] - Any variable to interpolate text. If the last argument is an object, it will be used to override ora's options
   * @returns {Print} Return the instance itself, usefull for method chaining
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
   * @returns {Print} Return the instance itself, usefull for method chaining
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
   * @returns {Print} Return the instance itself, usefull for method chaining
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
   * @returns {Print} Return the instance itself, usefull for method chaining
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
   * @returns {Print} Return the instance itself, usefull for method chaining
   */
  warn = (text, ...args) => {
    this.setText(text, ...args)
    this.ora.warn()
    return this
  }

  /**
   * Print information message, prefixed with an info icon
   *
   * @method
   * @param {string} text - Text to use
   * @param {...any} [args] - Any variable to interpolate text. If the last argument is an object, it will be used to override ora options
   * @returns {Print} Return the instance itself, usefull for method chaining
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
   * @returns {Print} Return the instance itself, usefull for method chaining
   */
  clear = () => {
    this.ora.clear()
    return this
  }

  /**
   * Force render spinner
   *
   * @method
   * @returns {Print} Return the instance itself, usefull for method chaining
   */
  render = () => {
    this.ora.render()
    return this
  }

  /**
   * Print failed message, prefixed with a cross icon and exit
   *
   * @method
   * @param {string} text - Text to use
   * @param {...any} [args] - Any variable to interpolate text. If the last argument is an object, it will be used to override ora options
   */
  fatal = (text, ...args) => {
    if (text instanceof Error) {
      text = text.message
      args = []
    }
    this.setText(text, ...args)
    this.ora.fail()
    if (text instanceof Error && this.app.bajo.config.log.level === 'trace') console.error(text)
    this.app.exit()
  }

  /**
   * Create a new print instance
   *
   * @method
   * @param {TPrintOptions} [options] - Options object. If not provided, defaults to the current options
   * @returns {Print} Return new print instance
   */
  spinner = (options) => {
    const spin = new Print(this.plugin, options ?? this.options)
    spin.startTime = this.startTime.clone()
    return spin
  }
}

export default Print
