import util from 'util'
import lodash from 'lodash'
import Bajo from './bajo.js'
import fastGlob from 'fast-glob'
import { sprintf } from 'sprintf-js'
import outmatch from 'outmatch'
import dayjs from '../lib/dayjs.js'
import fs from 'fs-extra'
import aneka from 'aneka/index.js'
import Plugin from './plugin.js'
import resolvePath from '../lib/resolve-path.js'
import parseArgsArgv from '../lib/parse-args-argv.js'
import parseEnv from '../lib/parse-env.js'
import {
  buildBaseConfig,
  buildExtConfig,
  buildPlugins,
  collectConfigHandlers,
  bootOrder,
  bootPlugins,
  exitHandler,
  runAsApplet
} from './helper/bajo.js'

const { isPlainObject, get, reverse, map, isString } = lodash
let unknownLangWarning = false

function outmatchNs (source, pattern) {
  const { breakNsPath } = this.bajo
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

const { last, without, keys } = lodash

/**
 * @typedef TAppEnv
 * @type {Object}
 * @property {string} dev=development
 * @property {string} staging=staging
 * @property {string} prod=production
 * @see App
 */

/**
 * @typedef TAppLib
 * @type {Object}
 * @property {Object} _ - Access to {@link https://lodash.com|lodash}
 * @property {Object} fs - Access to {@link https://github.com/jprichardson/node-fs-extra|fs-extra}
 * @property {Object} fastGlob - Access to {@link https://github.com/mrmlnc/fast-glob|fast-glob}
 * @property {Object} sprintf - Access to {@link https://github.com/alexei/sprintf.js|sprintf}
 * @property {Object} aneka - Access to {@link https://github.com/ardhi/aneka|aneka}
 * @property {Object} outmatch - Access to {@link https://github.com/axtgr/outmatch|outmatch}
 * @property {Object} dayjs - Access to {@link https://day.js.org|dayjs} with utc & customParseFormat plugin already applied
 * @see App
 */
const lib = {
  _: lodash,
  fs,
  fastGlob,
  sprintf,
  outmatch,
  dayjs,
  aneka
}

/**
 * App class. This is where everything starts, the boot process:
 *
 * 1. Parsing all arguments and environment values
 * 2. Create {@link Bajo|Bajo} instance
 * 3. Building {@link module:Helper/Bajo.buildBaseConfig|base config}
 * 4. {@link module:Helper/Bajo.buildPlugins|Building plugins}
 * 5. Collect all {@link module:Helper/Bajo.collectConfigHandlers|config handler}
 * 6. Building {@link module:Helper/Bajo.buildExtConfig|extra config}
 * 7. Setup {@link module:Helper/Bajo.bootOrder|boot order}
 * 8. {@link module:Helper/Bajo.bootPlugins|Boot loaded plugins}
 * 9. Attach {@link module:Helper/Bajo.exitHandler|exit handlers}
 * 10. Finish
 *
 * After boot process is completed, event ```bajo:afterBootComplete``` is emitted.
 *
 * If app mode is ```applet```, it runs your choosen applet instead.
 *
 * @class
 */
class App {
  /**
   * Your main namespace. And yes, you suppose to NOT CHANGE this
   *
   * @memberof App
   * @constant {string}
   * @default 'main'
   */
  static mainNs = 'main'

  /**
   * App environments
   * @memberof App
   * @constant {TAppEnv}
   */
  static envs = { dev: 'development', staging: 'staging', prod: 'production' }

  /**
   * @param {string} cwd - Current working dirctory
   */
  constructor (cwd) {
    /**
     * Date/time when your app start
     * @type {Date}
     */
    this.runAt = new Date()

    /**
     * Applets
     *
     * @type {Array}
     */
    this.applets = []

    /**
     * List of all loaded plugin's package names
     *
     * @type {Array}
     */
    this.pluginPkgs = []

    /**
     * @typedef {Object} TAppConfigHandler
     * @property {string} ext - File extension
     * @property {function} [readHandler] - Function to call for reading
     * @property {function} [writeHandler] - Function to call for writing
     * @see App#configHandlers
     */

    /**
     * Config handlers.
     *
     * By default, there are two built-in handlers available: ```.js```
     * and ```.json```. Use plugins to add more, e.g {@link https://github.com/ardhi/bajo-config|bajo-config}
     * lets you to use ```.yaml/.yml``` and ```.toml```
     *
     * @type {TAppConfigHandler[]}
     */
    this.configHandlers = []

    /**
     * Gives you direct access to the most commonly used 3rd party library in a Bajo based app.
     * No manual import necessary, always available, anywhere, anytime!
     *
     * Example:
     * ```javascript
     * const { camelCase, kebabCase } = this.app.lib._
     * console.log(camelCase('Elit commodo sit et aliqua'))
     * ```
     *
     * @type {TAppLib}
     */
    this.lib = lib
    this.lib.outmatchNs = outmatchNs.bind(this)

    /**
     * All plugin's class definitions are saved here as key-value pairs with plugin name as its key.
     * The special key ```base``` is for {@link BasePlugin}'s class so anytime you want to
     * create your own plugin, just use something like this:
     *
     * ```javascript
     * class MyPlugin extends this.app.pluginClass.base {
     *   ... your class
     * }
     */
    this.pluginClass = { base: Plugin }

    if (!cwd) cwd = process.cwd()
    const l = last(process.argv)
    if (l.startsWith('--cwd')) {
      const parts = l.split('=')
      cwd = parts[1]
    }
    this.dir = resolvePath(cwd)
    process.env.APPDIR = this.dir
  }

  get mainNs () {
    return this.constructor.mainNs
  }

  /**
   * Add and save plugin and it's class definition (if provided)
   *
   * @method
   * @param {TPlugin} plugin - A valid bajo plugin
   * @param {Object} [pluginClass] - Plugin's class definition
   */
  addPlugin = (plugin, pluginClass) => {
    if (this[plugin.name]) throw new Error(`Plugin '${plugin.name}' added already`)
    this[plugin.name] = plugin
    if (pluginClass) this.pluginClass[plugin.name] = pluginClass
  }

  /**
   * Get all loaded plugin names
   *
   * @method
   * @returns {string[]}
   */
  getPluginNames = () => {
    return without(keys(this.pluginClass), 'base')
  }

  /**
   * Dumping variable on screen
   *
   * @method
   * @param  {...any} args - any arguments passed will be displayed on screen. If the last argument is a boolean 'true', app will quit rightaway
   */
  dump = (...args) => {
    const terminate = last(args) === true
    if (terminate) args.pop()
    for (const arg of args) {
      const result = util.inspect(arg, false, null, true)
      console.log(result)
    }
    if (terminate) process.kill(process.pid, 'SIGINT')
  }

  /**
   * Booting the app
   *
   * @method
   * @async
   * @returns {App}
   */
  boot = async () => {
    // argv/args
    const { args, argv } = await parseArgsArgv.call(this) ?? {}
    this.argv = argv
    this.args = args
    this.env = parseEnv() ?? {}

    this.bajo = new Bajo(this)
    await buildBaseConfig.call(this.bajo)
    await buildPlugins.call(this.bajo)
    await collectConfigHandlers.call(this.bajo)
    await buildExtConfig.call(this.bajo)
    await bootOrder.call(this.bajo)
    await bootPlugins.call(this.bajo)
    await exitHandler.call(this.bajo)
    // boot complete
    const elapsed = new Date() - this.runAt
    this.bajo.log.info('bootCompleted%s', this.lib.aneka.secToHms(elapsed, true))
    await this.bajo.runHook('bajo:afterBootComplete')
    if (this.bajo.applet) await runAsApplet.call(this.bajo)
    return this
  }

  /**
   * Terminate the app and back to console
   *
   * @method
   * @param {string} [signal=SIGINT] - Signal to send
   */
  exit = (signal = 'SIGINT') => {
    process.kill(process.pid, 'SIGINT')
  }

  /**
   * Load internationalization & languages files for particular plugin
   *
   * @method
   * @param {string} ns - Plugin name
   */
  loadIntl = (ns) => {
    this[ns].intl = {}
    for (const l of this.bajo.config.intl.supported) {
      this[ns].intl[l] = {}
      const path = `${this[ns].dir.pkg}/extend/bajo/intl/${l}.json`
      if (!fs.existsSync(path)) continue
      const trans = fs.readFileSync(path, 'utf8')
      try {
        this[ns].intl[l] = JSON.parse(trans)
      } catch (err) {}
    }
  }

  /**
   * Translate text and interpolate with given ```args```.
   *
   * There is a shortcut to this method attached on all plugins. You'll normally call that shorcut
   * instead of this method, because it is bound to plugin's name already
   *
   * ```javascript
   * ... within your main plugin
   * const translated = this.app.t('main', 'My cute cat is %s', 'purring')
   * // or
   * const translated = this.t('My cute cat is %s', 'purring')
   * ```
   * @method
   * @param {string} ns - Namespace
   * @param {string} text - Text to translate
   * @param  {...any} args - Arguments
   * @returns {string}
   */
  t = (ns, text, ...args) => {
    if (!text) {
      text = ns
      ns = 'bajo'
    }
    const opts = last(args)
    let lang = this.bajo.config.lang
    if (isPlainObject(opts)) {
      args.pop()
      if (opts.lang) lang = opts.lang
    }
    const { fallback, supported } = this.bajo.config.intl
    if (!unknownLangWarning && !supported.includes(lang)) {
      unknownLangWarning = true
      this.bajo.log.warn('unsupportedLangFallbackTo%s', fallback)
    }
    const plugins = reverse(without([...this.getPluginNames()], ns))
    plugins.unshift(ns)
    plugins.push('bajo')

    let trans
    for (const p of plugins) {
      const store = get(this, `${p}.intl.${lang}`, {})
      trans = get(store, text)
      if (trans) break
    }
    if (!trans) {
      for (const p of plugins) {
        const store = get(this, `${p}.intl.${fallback}`, {})
        trans = get(store, text)
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
}

export default App
