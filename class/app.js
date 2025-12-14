import util from 'util'
import lodash from 'lodash'
import Bajo from './bajo.js'
import fastGlob from 'fast-glob'
import { sprintf } from 'sprintf-js'
import outmatch from 'outmatch'
import fs from 'fs-extra'
import aneka from 'aneka/index.js'
import Base from './base.js'
import freeze from '../lib/freeze.js'
import { runAsApplet } from './helper/bajo.js'
import Tools from './plugin/tools.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import weekOfYear from 'dayjs/plugin/weekOfYear.js'
import generateId from '../lib/generate-id.js'
import findDeep from '../lib/find-deep.js'

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(localizedFormat)
dayjs.extend(weekOfYear)

const { isPlainObject, get, reverse, map, last, without, keys } = lodash
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

/**
 * @typedef {Object} TAppEnv
 * @property {string} dev=development
 * @property {string} prod=production
 * @see App
 */

/**
 * @typedef {Object} TAppLib
 * @property {Object} _ - Access to {@link https://lodash.com|lodash}
 * @property {Object} fs - Access to {@link https://github.com/jprichardson/node-fs-extra|fs-extra}
 * @property {Object} fastGlob - Access to {@link https://github.com/mrmlnc/fast-glob|fast-glob}
 * @property {Object} sprintf - Access to {@link https://github.com/alexei/sprintf.js|sprintf}
 * @property {Object} aneka - Access to {@link https://github.com/ardhi/aneka|aneka}
 * @property {Object} outmatch - Access to {@link https://github.com/axtgr/outmatch|outmatch}
 * @property {Object} dayjs - Access to {@link https://day.js.org|dayjs} with utc & customParseFormat plugin already applied
 * @property {Object} freeze
 * @property {Object} generateId
 * @property {Object} findDeep
 * @property {Object} Tools - Tools class
 * @see App
 */
const lib = {
  _: lodash,
  fs,
  fastGlob,
  sprintf,
  outmatch,
  dayjs,
  aneka,
  freeze,
  generateId,
  findDeep,
  Tools
}

/**
 * App class. This is the root. This is where all plugins call it home.
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
  static envs = { dev: 'development', prod: 'production' }

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
    this.lib.parseObject = (obj, options = {}) => {
      const me = this
      const { ns, lang } = options
      options.translator = {
        lang,
        prefix: 't:',
        handler: val => {
          const scope = ns ? me.app[ns] : me
          const [text, ...args] = val.split('|')
          return scope.t(text, ...args, { lang })
        }
      }
      return aneka.parseObject(obj, options)
    }

    /**
     * Instance of system log
     *
     * @type {Log}
     */
    this.log = {}

    /**
     * All plugin's class definitions are saved here as key-value pairs with plugin name as its key.
     * The special key ```base``` is for {@link Base}'s class so anytime you want to
     * create your own plugin, just use something like this:
     *
     * ```javascript
     * class MyPlugin extends this.app.pluginClass.base {
     *   ... your class
     * }
     */
    this.pluginClass = { base: Base }

    /**
     * If app runs in applet mode, this will be the applet's name
     *
     * @type {string}
     */
    this.applet = undefined

    /**
     * Program arguments
     *
     * ```
     * $ node index.js arg1 arg2
     * ...
     * console.log(this.args) // it should print: ['arg1', 'arg2']
     * ```
     *
     * @type {string[]}
     * @see module:Lib.parseArgsArgv
     */
    this.args = []

    /**
     * Program options.
     *
     * - Dash (```-```) breaks the string into object keys
     * - While colon (```:```) is used as namespace separator. If no namespace found, it is saved under ```_``` key.
     *
     * Values are parsed automatically. See {@link https://github.com/ladjs/dotenv-parse-variables|dotenv-parse-variables}
     * for details.
     *
     * ```
     * $ node index.js --my-name-first=John --my-name-last=Doe --my-birthDay=secret --nameSpace:path-subPath=true
     * ...
     * // {
     * //   _: {
     * //    my: {
     * //       name: { first: 'John', last: 'Doe' },
     * //       birthDay: 'secret'
     * //     }
     * //   },
     * //   nameSpace: { path: { subPath: true } }
     * // }
     * ```
     *
     * @type {Object}
     * @see module:Lib.parseArgsArgv
     */
    this.argv = {}

    /**
     * Environment variables. Support dotenv (```.env```) file too!
     *
     * - Underscore (```_```) translates key to camel-cased one
     * - Double underscores (```__```) breaks the key into object keys
     * - While dot (```.```) is used as namespace separator. If no namespace found, it is saved under ```_``` key.
     *
     * Values are also parsed automatically using {@link https://github.com/ladjs/dotenv-parse-variables|dotenv-parse-variables}.
     *
     * Example:
     *
     * - ```MY_KEY=secret``` → ```{ _: { myKey: 'secret' } }```
     * - ```MY_KEY__SUB_KEY=supersecret``` → ```{ _: { myKey: { subKey: 'supersecret' } } }```
     * - ```MY_NS.MY_NAME=John``` → ```{ myNs: { myName: 'John' } }```
     *
     * @type {Object}
     * @see module:Lib.parseEnv
     */
    this.envVars = {}

    if (!cwd) cwd = process.cwd()
    const l = last(process.argv)
    if (l.startsWith('--cwd')) {
      const parts = l.split('=')
      cwd = parts[1]
    }
    this.dir = aneka.resolvePath(cwd)
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
    if (this[plugin.ns]) throw new Error(`Plugin '${plugin.ns}' added already`)
    this[plugin.ns] = plugin
    if (pluginClass) this.pluginClass[plugin.ns] = pluginClass
  }

  /**
   * Get all loaded plugin namesspaces
   *
   * @method
   * @returns {string[]}
   */
  getAllNs = () => {
    return without(keys(this.pluginClass), 'base')
  }

  /**
   * Dumping variable on screen. Like ```console.log``` but with max 10 depth.
   *
   * @method
   * @param  {...any} args - any arguments passed will be displayed on screen. If the last argument is a boolean 'true', app will quit rightaway
   */
  dump = (...args) => {
    const terminate = last(args) === true
    if (terminate) args.pop()
    for (const arg of args) {
      const result = util.inspect(arg, { depth: 10, colors: true })
      console.log(result)
    }
    if (terminate) process.kill(process.pid, 'SIGINT')
  }

  /**
   * Boot process:
   *
   * - Parsing {@link module:Lib.parseArgsArgv|program arguments, options} and {@link module:Lib.parseEnv|environment values}
   * - Create {@link Bajo|Bajo} instance & initialize it
   * - {@link module:Helper/Bajo.runAsApplet|Run in applet mode} if ```-a``` or ```--applet``` is given
   *
   * After boot process is completed, event ```bajo:afterBootComplete``` is emitted.
   *
   * If app mode is ```applet```, it runs your choosen applet instead.
   *
   * @method
   * @async
   * @returns {App}
   * @fires bajo:afterBootComplete
   */
  boot = async () => {
    // argv/args/env
    this.bajo = new Bajo(this)
    const { argv, args } = aneka.parseObject(await aneka.parseArgsArgv() ?? {}, { parseValue: true })
    this.args = args
    this.argv = argv
    this.envVars = aneka.parseObject(aneka.parseEnv(), { parseValue: true })
    this.applet = this.envVars._.applet ?? this.argv._.applet
    await this.bajo.init()
    // boot complete
    const elapsed = new Date() - this.runAt
    this.bajo.log.debug('bootCompleted%s', aneka.secToHms(elapsed, true))
    /**
     * Run after boot process is completed
     *
     * @global
     * @event bajo:afterBootComplete
     * @see {@tutorial hook}
     * @see App#boot
     */
    await this.bajo.runHook('bajo:afterBootComplete')
    if (this.applet) await runAsApplet.call(this.bajo)
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
   * @param  {...any} params - Arguments
   * @returns {string}
   */
  t = (ns, text, ...params) => {
    if (!text) {
      text = ns
      ns = 'bajo'
    }
    const opts = last(params)
    let lang = this.bajo.config.lang
    if (isPlainObject(opts)) {
      params.pop()
      if (opts.lang) lang = opts.lang
    }
    const { fallback, supported } = this.bajo.config.intl
    if (!unknownLangWarning && !supported.includes(lang)) {
      unknownLangWarning = true
      this.bajo.log.warn(`Unsupported language, fallback to '${fallback}'`)
    }
    const plugins = reverse(without([...this.getAllNs()], ns))
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
    return aneka.formatText(trans, ...params)
  }

  /**
   * Helper method to list all supported config formats
   *
   * @returns {string[]}
   */
  getConfigFormats = () => {
    return map(this.configHandlers, 'ext')
  }

  startPlugin = (ns, ...args) => {
    this[ns].start(...args)
  }

  stopPlugin = (ns, ...args) => {
    this[ns].stop(...args)
  }
}

export default App
