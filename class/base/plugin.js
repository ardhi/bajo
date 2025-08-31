import lodash from 'lodash'
import omittedPluginKeys from '../../lib/omitted-plugin-keys.js'
import Err from './err.js'

const { get, isEmpty, cloneDeep, omit, isPlainObject, camelCase } = lodash

/**
 * This is the base class for all bajo plugin.
 *
 * Two main plugins exist:
 * - {@link Bajo} - Core plugin class, responsible for boot system etc. You should not touch this
 * - {@link Plugin} - Plugin class your own plugin should extend from
 *
 * @class
 */
class BasePlugin {
  /**
   * Package name, the one from package.json
   *
   * @memberof BasePlugin
   * @constant {string}
   */
  static pkgName

  /**
   * Plugin name. Simply the camel cased version of plugin's package name
   *
   * @memberof BasePlugin
   * @constant {string}
   */
  static pluginName

  /**
   * Plugin alias. Derived plugin must provide its own, unique alias. If it left blank,
   * Bajo will provide this automatically (by using the kebab-cased version of plugin name)
   *
   * @readonly
   * @memberof BasePlugin
   * @type {string}
   */
  static alias = ''

  /**
   * @param {string} pkgName - Package name (the one you use in package.json)
   * @param {Object} app - App instance reference. Usefull to call app method inside a plugin
   */
  constructor (pkgName, app) {
    this.constructor.pkgName = pkgName
    this.constructor.pluginName = camelCase(pkgName)

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
  }

  log = {
    trace: (...params) => this.app.log.trace(this.name, ...params),
    debug: (...params) => this.app.log.debug(this.name, ...params),
    info: (...params) => this.app.log.info(this.name, ...params),
    warn: (...params) => this.app.log.warn(this.name, ...params),
    error: (...params) => this.app.log.error(this.name, ...params),
    fatal: (...params) => this.app.log.fatal(this.name, ...params),
    silent: (...params) => this.app.log.silent(this.name, ...params)
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
   * Getter for plugin's name
   *
   * @type {string}
   */
  get name () {
    return this.constructor.pluginName
  }

  /**
   * Getter for plugin's alias
   *
   * @type {string}
   */
  get alias () {
    return this.constructor.alias
  }

  t = (text, ...params) => {
    return this.app.t(this.name, text, ...params)
  }
}

export default BasePlugin
