import lodash from 'lodash'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'
import Log from './log.js'
import Print from './print.js'
import BajoError from './error.js'
import fastGlob from 'fast-glob'
import { sprintf } from 'sprintf-js'
import outmatch from 'outmatch'
import dayjs from '../lib/dayjs.js'
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
 * Plugin's base class
 *
 * @class
 */
class Plugin {
  /**
   * Class constructor
   *
   * @param {string} pkgName - Package name (the one you use in package.json)
   * @param {Object} app - App instance reference. Usefull to call app method inside a plugin
   */
  constructor (pkgName, app) {
    this.pkgName = pkgName
    this.name = camelCase(pkgName)
    this.app = app
    this.config = {}
    this.lib = lib
    this.lib.outmatchNs = outmatchNs.bind(this)
  }

  /**
   * Get plugin's config value
   *
   * @method
   * @param {string} [path] - dot separated config path (think of lodash's 'get'). If not provided, the full config will be given
   * @param {Object} [options={}] - Options
   * @param {*} [options.defValue={}] - Default value to use if returned object is undefined
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
   * Initialize plugin's logger
   *
   * @method
   */
  initLog = () => {
    this.log = new Log(this)
    this.log.init()
  }

  /**
   * Initialize plugin's print engine
   *
   * @method
   * @param {Object} [opts] - Print options. Refer to Print class for more info
   */
  initPrint = (options) => {
    this.print = new Print(this, options)
    this.print.init()
  }

  /**
   * Create an instance of BajoError object
   *
   * @method
   * @param {msg} msg - Error message
   * @param  {...*} [args] - Argument variables you might want to add to the error object
   * @returns {Object} BajoError instance
   */
  error = (msg, ...args) => {
    if (!this.print) return new Error(msg, ...args)
    const error = new BajoError(this, msg, ...args)
    return error.write()
  }

  /**
   * Create an instance of BajoError object, display it on screen and then force
   * terminate the app process
   *
   * @method
   * @param {msg} msg - Error message
   * @param  {...*} [args] - Argument variables you might want to add to the error object
   */
  fatal = (msg, ...args) => {
    if (!this.print) return new Error(msg, ...args)
    const error = new BajoError(this, msg, ...args)
    error.fatal()
  }
}

export default Plugin
