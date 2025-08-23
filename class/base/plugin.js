import lodash from 'lodash'
import omittedPluginKeys from '../../lib/omitted-plugin-keys.js'
import Log from './log.js'
import Print from './print.js'
import Err from './err.js'
import fastGlob from 'fast-glob'
import { sprintf } from 'sprintf-js'
import outmatch from 'outmatch'
import dayjs from '../../lib/dayjs.js'
import fs from 'fs-extra'
import aneka from 'aneka/index.js'

function outmatchNs (source, pattern) {
  const { breakNsPath } = this.app.bajo
  const [src, subSrc] = source.split(':')
  if (!subSrc) return pattern === src
  try {
    const { fullNs, path } = breakNsPath(pattern)
    const isMatch = outmatch(path)
    return src === fullNs && isMatch(subSrc)
  } catch (err) {
    return false
  }
}

const lib = {
  _: lodash,
  fs,
  fastGlob,
  sprintf,
  outmatch,
  dayjs,
  aneka
}

const { get, isEmpty, cloneDeep, omit, isPlainObject, camelCase } = lodash

/**
 * This is the base class of bajo's plugin system.
 *
 * @class
 */
class BasePlugin {
  /**
   * @param {string} pkgName - Package name (the one you use in package.json)
   * @param {Object} app - App instance reference. Usefull to call app method inside a plugin
   */
  constructor (pkgName, app) {
    /**
     * Package name, the one from package.json
     * @type {string}
     */
    this.pkgName = pkgName

    /**
     * Plugin name. Simply the camel cased version of plugin's package name
     *
     * @type {string}
     */
    this.name = camelCase(pkgName)

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
     */
    this.config = {}

    /**
     * Property to give you direct access to the most commonly used 3rd party library in a bajo based app.
     * No manual import necessary, always available, everywhere, anytime!
     *
     * Example:
     * ```javascript
     * const { camelCase, kebabCase } = this.lib._
     * console.log(camelCase('Elit commodo sit et aliqua'))
     * ```
     *
     * @type {Object}
     * @property {Object} _ - Access to {@link https://lodash.com|lodash}
     * @property {Object} fs - Access to {@link https://github.com/jprichardson/node-fs-extra|fs-extra}
     * @property {Object} fastGlob - Access to {@link https://github.com/mrmlnc/fast-glob|fast-glob}
     * @property {Object} sprintf - Access to {@link https://github.com/alexei/sprintf.js|sprintf}
     * @property {Object} aneka - Access to {@link https://github.com/ardhi/aneka|aneka}
     * @property {Object} outmatch - Access to {@link https://github.com/axtgr/outmatch|outmatch}
     * @property {Object} dayjs - Access to {@link https://day.js.org|dayjs} with utc & customParseFormat plugin already applied
     */
    this.lib = lib
    this.lib.outmatchNs = outmatchNs.bind(this)
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
   * Initialize log. Please refer to {@link Log} class for more info
   *
   * @method
   */
  initLog = () => {
    this.log = new Log(this)
    this.log.init()
  }

  /**
   * Initialize print engine. Please refer to {@link Print} class for more info
   *
   * @method
   * @param {Object} [options] - Print options
   */
  initPrint = (options) => {
    this.print = new Print(this, options)
    this.print.init()
  }

  /**
   * Create an instance of {@link Err} object
   *
   * @method
   * @param {msg} msg - Error message
   * @param  {...any} [args] - Argument variables you might want to add to the error object
   * @returns {Object} Err instance
   */
  err = (msg, ...args) => {
    if (!this.print) return new Error(msg, ...args)
    const error = new Err(this, msg, ...args)
    return error.write()
  }

  /**
   * Alias to err () method above
   *
   * @method
   */
  error = (msg, ...args) => {
    return this.error(msg, ...args)
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
}

export default BasePlugin
