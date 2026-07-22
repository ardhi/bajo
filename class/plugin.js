import lodash from 'lodash'
import Err from './err.js'

const { get, isEmpty, cloneDeep, omit, isPlainObject, camelCase } = lodash

/**
 * The **root** plugin class. All Bajo plugin classes inherit from this class respectfully.
 *
 * This class provides the basic structure and functionality for all plugins in the Bajo framework.
 * It includes methods for configuration management, error handling, logging, and more.
 *
 * Only two direct descendants of this class are allowed:
 * - {@link Bajo} - Bajo core plugin class, responsible for system wide setup and boot process. You should not touch this obviously
 * - {@link Base} - Base plugin class **your own plugin should inherit from**
 *
 * @class
 */
class Plugin {
  /**
   * Constructor.
   *
   * @param {string} pkgName - Package name (the one in package.json)
   * @param {Object} app - App instance reference. Usefull to call app method inside a plugin
   */
  constructor (pkgName, app) {
    /**
     * Package name, the one from package.json.
     *
     * @type {string}
     */
    this.pkgName = pkgName

    /**
     * Namespace (ns) or plugin's name. It is the camel cased version of plugin's package name.
     *
     * @type {string}
     */
    this.ns = camelCase(pkgName)

    /**
     * Plugin alias. Derived plugin must provide its own, unique alias. If it left blank,
     * Bajo will provide this automatically (by using the kebab-cased version of plugin name).
     *
     * By convention, plugin alias should be all lower case, alphanumeric, and without any space or special character except `-`.
     * It should be unique across all plugins in the Bajo framework, as it is used to identify the plugin in the system beside its namespace.
     *
     * @type {string}
     */
    this.alias = null

    /**
     * Reference to the app instance
     * @type {App}
     */
    this.app = app

    /**
     * Configuration object.
     *
     * @type {TConfig}
     * @see {@tutorial config}
     */
    this.config = {}

    /**
     * Shortcut to {@link App#log} with prefix parameter set to this plugin namespace.
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
   * Get package info. Basically it reads the package.json file and returns the requested fields
   *
   * @method
   * @param {string} [dir] - Package directory. Defaults to the current plugin's package dir
   * @param {Array} [keys=['name', 'version', 'description', 'author', 'license', 'homepage', 'bajo']] - Field keys to be use. Set empty to use all keys
   * @returns {Object} Package info object
   */
  getPkgInfo = (dir, keys = ['name', 'version', 'description', 'author', 'license', 'homepage', 'bajo']) => {
    const { pick, isEmpty } = this.app.lib._
    const { fs } = this.app.lib
    const file = `${dir ?? this.dir.pkg}/package.json`
    const pkg = fs.readJsonSync(file)
    return isEmpty(keys) ? pkg : pick(pkg, keys)
  }

  /**
   * Get plugin's configuration object's value.
   *
   * > **Note**: Configuration object is frozen after boot process, so you can't modify it at runtime.
   * If you want to change its values, you need to do it in the config file, program options or via environment variables.
   * Hooks are also available to modify the configuration before the boot process.
   *
   * @method
   * @param {string} [path] - dot separated config path (think of lodash's 'get'). If not provided, the full config will be given
   * @param {Object} [options={}] - Options object
   * @param {any} [options.defValue={}] - Default value to use if returned object is undefined
   * @param {string[]} [options.omit=[]] - Omit these keys from returned object
   * @param {boolean} [options.noClone=false] - Set true to **NOT clone** returned object
   * @returns {Object} Returned object. If no path provided, the whole config object is returned
   */
  getConfig = (path, options = {}) => {
    let obj = isEmpty(path) ? this.config : get(this.config, path, options.defValue ?? {})
    options.omit = options.omit ?? []
    if (isPlainObject(obj) && !isEmpty(options.omit)) obj = omit(obj, options.omit)
    if (!options.noClone) obj = cloneDeep(obj)
    return obj
  }

  /**
   * Create an instance of {@link Err} object by providing an error message and optional arguments. Error instance will
   * then be displayed on console and returned so you can chain it with other methods if you want.
   *
   * Typically, you would use this method to throw an error and the framework will handle it gracefully.
   *
   * This method is a shortcut to create a new Err instance.
   *
   * @method
   * @param {string} msg - Error message
   * @param  {...*} [args] - Argument variables you might want to add to the error object
   * @returns {Err} Err instance
   * @see {@link Err#write}
   */
  error = (msg, ...args) => {
    if (!this.print) return new Error(msg, ...args)
    const error = new Err(this, msg, ...args)
    return error.write()
  }

  /**
   * Same as {@link Plugin#error} but will *forcefully* terminate the process after printing the error to console.
   *
   * @method
   * @param {string} msg - Error message
   * @param  {...*} [args] - Argument variables you might want to add to the error object
   * @returns {void}
   */
  fatal = (msg, ...args) => {
    if (!this.print) return new Error(msg, ...args)
    const error = new Err(this, msg, ...args)
    error.fatal()
  }

  /**
   * Translate text and interpolate with given `args`.
   *
   * Shortcut to {@link App#t} with ns parameter set to this plugin namespace.
   *
   * @method
   * @param {string} text - Text to translate
   * @param  {...*} args - Arguments to interpolate to `text`
   * @returns {string}
   * @see {@link App#t}
   */
  t = (text, ...args) => {
    return this.app.t(this.ns, text, ...args)
  }

  /**
   * Check whether translation text (key) exists.
   *
   * Shortcut to {@link App#te} with ns parameter set to this plugin namespace.
   *
   * @method
   * @param {string} text - Text to translate
   * @param  {...*} args - Arguments to interpolate to `text`
   * @returns {boolean}
   * @see {@link App#te}
   */
  te = (text, ...args) => {
    return this.app.te(this.ns, text, ...args)
  }

  /**
   * Force bind methods to `this` context.
   *
   * Since JavaScript's `this` is dynamic, this method is useful to ensure
   * that the methods always refer to the correct instance of the class.
   *
   * Typically, you would call this method in the constructor of your plugin class, passing an array of method names that you want to bind.
   * @method
   * @param {string[]} names - Method's names
   * @returns {void}
   */
  bindThis (names) {
    if (!Array.isArray(names)) names = [names]
    for (const name of names) {
      this[name] = this[name].bind(this)
    }
  }

  /**
   * Shortcut to `this.app.dump()`.
   *
   * @method
   * @param {...*} args - Arguments
   * @returns {void}
   */
  dump = (...args) => {
    this.app.dump(...args)
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
    this.config = null
  }
}

export default Plugin
