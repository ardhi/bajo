import util from 'util'
import Bajo from './bajo.js'
import Base from './base.js'
import { runAsApplet } from './helper/bajo.js'
import Tools from './plugin/tools.js'

import { outmatchNs, parseObject, lib } from './helper/app.js'

const { camelCase, isPlainObject, get, reverse, map, last, without, set } = lib._
const { pascalCase } = lib.aneka
let unknownLangWarning = false

/**
 * @typedef {Object} TAppEnv
 * @property {string} dev=development
 * @property {string} prod=production
 * @see App
 */

/**
 * App class. This is the root. This is where all plugins call it home.
 *
 * @class
 */
class App {
  /**
   * @param {Object} [options] - App options
   * @param {string} [options.cwd] - Set current working directory. Defaults to the script directory
   * @param {string[]} [options.plugins] - Array of plugins to load. If provided, it override the list in ```package.json``` and ```.plugins``` file
   * @param {Object} [options.config] - Plugin's config object. If provided, plugin configs will no longer be read from its config files
   */
  constructor (options = {}) {
    /**
     * Copy of provided options
     *
     * @type {Object}
     */
    this.options = options

    /**
     * Your main namespace. And yes, you suppose to NOT CHANGE this
     *
     * @memberof App
     * @constant {string}
     * @default 'main'
     */
    this.mainNs = 'main'

    /**
     * App environments
     * @memberof App
     * @constant {TAppEnv}
     */
    this.envs = { dev: 'development', prod: 'production' }

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
    this.pluginPkgs = options.plugins ?? []

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
    this.lib.parseObject = parseObject.bind(this)

    /**
     * Instance of system log
     *
     * @type {Log}
     */
    this.log = {}

    /**
     * All plugin's base class are saved here as key-value pairs with plugin name as its key.
     * The special key ```Base``` && ```Tools``` is for {@link Base} & {@link Tools} class so anytime you want to
     * create your own plugin, just use something like this:
     *
     * ```javascript
     * class MyPlugin extends this.app.baseClass.Base {
     *   ... your class
     * }
     */
    this.baseClass = { Base, Tools }

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

    if (!options.cwd) options.cwd = process.cwd()
    const l = last(process.argv)
    if (l.startsWith('--cwd')) {
      const parts = l.split('=')
      options.cwd = parts[1]
    }
    this.dir = this.lib.aneka.resolvePath(options.cwd)
    process.env.APPDIR = this.dir
  }

  /**
   * Add and save plugin and it's base class definition (if provided)
   *
   * @method
   * @param {TPlugin} plugin - A valid bajo plugin
   * @param {Object} [baseClass] - Base class definition
   */
  addPlugin = (plugin, baseClass) => {
    if (this[plugin.ns]) throw new Error(`Plugin '${plugin.ns}' added already`)
    this[plugin.ns] = plugin
    if (baseClass) this.baseClass[pascalCase(plugin.ns)] = baseClass
  }

  /**
   * Get all loaded plugin namespaces
   *
   * @method
   * @returns {string[]}
   */
  getAllNs = () => {
    return this.pluginPkgs.map(pkg => camelCase(pkg))
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
    // if (terminate) process.kill(process.pid, 'SIGINT')
    if (terminate) process.exit('1')
  }

  /**
   * Boot process:
   *
   * - Parsing {@link module:Lib.parseArgsArgv|program arguments, options} and {@link module:Lib.parseEnv|environment values}
   * - Create {@link Bajo|Bajo} instance & initialize it
   * - {@link module:Helper/Bajo.runAsApplet|Run in applet mode} if ```-a``` or ```--applet``` is given
   *
   * After boot process is completed, event ```bajo:afterBootCompleted``` is emitted.
   *
   * If app mode is ```applet```, it runs your choosen applet instead.
   *
   * @method
   * @async
   * @returns {App}
   * @fires bajo:afterBootCompleted
   */
  boot = async () => {
    this.bajo = new Bajo(this)
    this.bajo.hooks.push(...(this.options.hooks ?? []))
    delete this.options.hooks
    // argv/args/env
    const { parseArgsArgv, parseEnv, secToHms } = this.lib.aneka
    const { parseObject } = this.lib
    const { argv, args } = await parseArgsArgv({ cwd: this.options.cwd })

    this.args = args
    this.argv = parseObject(argv, { parseValue: true })
    this.envVars = parseObject(parseEnv(), { parseValue: true })
    if (get(this, 'envVars._.env') === '[object Object]') set(this, 'envVars._.env', 'dev')
    this.applet = this.envVars._.applet ?? this.argv._.applet
    await this.bajo.runHook('bajo:beforeBoot')
    await this.bajo.init()
    // boot complete
    const elapsed = new Date() - this.runAt
    this.bajo.log.debug('bootCompleted%s', secToHms(elapsed, true))
    /**
     * Run after boot process is completed
     *
     * @global
     * @event bajo:afterBootComplete
     * @see {@tutorial hook}
     * @see App#boot
     */
    await this.bajo.runHook('bajo:afterBoot')
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
    if (signal === true) process.exit('1')
    process.kill(process.pid, signal)
  }

  /**
   * Load internationalization & languages files for particular plugin
   *
   * @method
   * @param {string} ns - Plugin name
   */
  loadIntl = (ns) => {
    const { fs } = this.lib

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
    const { formatText } = this.lib.aneka

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
    return formatText(trans, ...params)
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
