import lodash from 'lodash'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'
import Err from './misc/err.js'

const { get, isEmpty, cloneDeep, omit, isPlainObject, camelCase } = lodash

/**
 * This is the **mother** of all plugin classes. All Bajo plugin classess inherit from this class
 * respectfully.
 *
 * There are currently only two main plugins available:
 * - {@link Bajo} - Core plugin class, responsible for system wide setup and boot process. You should not touch this obviously
 * - {@link Base} - Base plugin class your own plugin should extend from
 *
 * @class
 */
class Plugin {
  /**
   * Package name, the one from package.json
   *
   * @memberof Plugin
   * @constant {string}
   */
  static pkgName

  /**
   * Namespace (ns) or plugin's name. Simply the camel cased version of plugin's package name
   *
   * @memberof Plugin
   * @constant {string}
   */
  static ns

  /**
   * Plugin alias. Derived plugin must provide its own, unique alias. If it left blank,
   * Bajo will provide this automatically (by using the kebab-cased version of plugin name)
   *
   * @readonly
   * @memberof Plugin
   * @type {string}
   */
  static alias = ''

  /**
   * @param {string} pkgName - Package name (the one you use in package.json)
   * @param {Object} app - App instance reference. Usefull to call app method inside a plugin
   */
  constructor (pkgName, app) {
    this.constructor.pkgName = pkgName
    this.constructor.ns = camelCase(pkgName)

    /**
     * Reference to app instance
     *
     * @type {Object}
     */
    this.app = app

    /**
     * Config object
     *
     * @type {Object}
     * @see {@tutorial config}
     */
    this.config = {}

    /**
     * Shortcut to {@link App#log} with prefix parameter set to this plugin name.
     *
     * @type {Log}
     */
    this.log = {
      trace: (...params) => this.app.log.trace(this.ns, ...params),
      debug: (...params) => this.app.log.debug(this.ns, ...params),
      info: (...params) => this.app.log.info(this.ns, ...params),
      warn: (...params) => this.app.log.warn(this.ns, ...params),
      error: (...params) => this.app.log.error(this.ns, ...params),
      fatal: (...params) => this.app.log.fatal(this.ns, ...params),
      silent: (...params) => this.app.log.silent(this.ns, ...params)
    }
  }

  /**
   * Get plugin's config value
   *
   * @method
   * @param {string} [path] - dot separated config path (think of lodash's 'get'). If not provided, the full config will be given
   * @param {Object} [options={}] - Options
   * @param {any} [options.defValue={}] - Default value to use if returned object is undefined
   * @param {string[]} [options.omit=[]] - Omit these keys from returned object
   * @param {boolean} [options.noClone=false] - Set true to NOT clone returned object
   * @returns {Object} Returned object. If no path provided, the whole config object is returned
   */
  getConfig = (path, options = {}) => {
    let obj = isEmpty(path) ? this.config : get(this.config, path, options.defValue ?? {})
    options.omit = options.omit ?? omittedPluginKeys
    if (isPlainObject(obj) && !isEmpty(options.omit)) obj = omit(obj, options.omit)
    if (!options.noClone) obj = cloneDeep(obj)
    return obj
  }

  /**
   * Create an instance of {@link Err} object
   *
   * @method
   * @param {msg} msg - Error message
   * @param  {...any} [args] - Argument variables you might want to add to the error object
   * @returns {Object} Err instance
   */
  error = (msg, ...args) => {
    if (!this.print) return new Error(msg, ...args)
    const error = new Err(this, msg, ...args)
    return error.write()
  }

  /**
   * Create an instance of Err object, display it on screen and then force
   * terminate the app process
   *
   * @method
   * @param {msg} msg - Error message
   * @param  {...any} [args] - Argument variables you might want to add to the error object
   */
  fatal = (msg, ...args) => {
    if (!this.print) return new Error(msg, ...args)
    const error = new Err(this, msg, ...args)
    error.fatal()
  }

  /**
   * Getter for plugin's package name
   *
   * @type {string}
   */
  get pkgName () {
    return this.constructor.pkgName
  }

  /**
   * Getter for plugin's ns
   *
   * @type {string}
   */
  get ns () {
    return this.constructor.ns
  }

  /**
   * Getter for plugin's alias
   *
   * @type {string}
   */
  get alias () {
    return this.constructor.alias
  }

  /**
   * Translate text and interpolate with given ```args```.
   *
   * Shortcut to {@link App#t} with ns parameter set to this plugin namespace.
   *
   * @param {string} text - Text to translate
   * @param  {...any} params - Variables to interpolate to ```text```
   * @returns {string}
   */
  t = (text, ...params) => {
    return this.app.t(this.ns, text, ...params)
  }
}

export default Plugin
