import util from 'util'
import Bajo from './bajo.js'
import Base from './base.js'
import Cache from './cache.js'
import Tools from './tools.js'
import Plugin from './plugin.js'
import { lib, runAsApplet } from '../lib/helper.js'
import { fileURLToPath } from 'url'

const { camelCase, isPlainObject, get, reverse, map, last, without, set } = lib._
const { pascalCase } = lib.aneka
let unknownLangWarning = false

function getCallerFilename () {
  const originalFunc = Error.prepareStackTrace
  let callerfile

  try {
    const err = new Error()
    Error.prepareStackTrace = (_, stack) => stack
    const currentfile = err.stack.shift().getFileName()

    while (err.stack.length) {
      callerfile = err.stack.shift().getFileName()
      if (currentfile !== callerfile) break
    }
  } catch (e) {}

  Error.prepareStackTrace = originalFunc
  return callerfile
}

/**
 * @typedef {Object} TEnv
 * @memberof App
 * @property {string} dev=development
 * @property {string} prod=production
 */

/**
 * @callback readHandler
 * @memberof App
 * @param {string} text - Text to be parsed
 * @param {object} options - Options object
 * @returns {object} Parsed object
 */

/**
 * @callback writeHandler
 * @memberof App
 * @param {Object} data - Data to be stringified
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.writeToFile=false] - If true, write result to a file
 * @param {string} [options.saveAsFile] - The file path to save result if writeToFile is true
 * @returns {string} Stringified result
 */

/**
 * @typedef {Object} TConfigHandler
 * @memberof App
 * @property {string} ns - Namespace
 * @property {string} ext - File extension
 * @property {App.readHandler} [readHandler] - Function to call for reading
 * @property {App.writeHandler} [writeHandler] - Function to call for writing
 */

/**
 * @typedef {Object} TOptions
 * @memberof App
 * @property {string} [cwd] - Set current working directory. Defaults to the script directory
 * @property {string[]} [plugins] - Array of plugins to load. If provided, it override the list in `package.json` and `.plugins` file
 * @property {Object} [config] - Plugin's config object. If provided, plugin configs will no longer be read from its config files
 */

/**
 * App class. This is the root. This is where all plugins call it home.
 *
 * @class
 */
class App {
  /**
   * Constructor.
   * @param {App.TOptions} [options={}] - Options object.
   */
  constructor (options = {}) {
    /**
     * Copy of provided options.
     * @type {App.TOptions}
     */
    this.options = options

    /**
     * Main namespace.
     * @type {string}
     */
    this.mainNs = 'main'

    /**
     * App environments.
     * @type {App.TEnv}
     */
    this.envs = { dev: 'development', prod: 'production' }

    /**
     * Date/time when your app start.
     * @type {Date}
     */
    this.runAt = new Date()

    /**
     * Applets container.
     * @type {Array}
     */
    this.applets = []

    /**
     * Plugin's package names container. This is the list of plugins to load.
     * @type {string[]}
     */
    this.pluginPkgs = options.plugins ?? []

    /**
     * Config handlers.
     *
     * By default, there are three built-in handlers: `.js`, `.json`
     * and `.yml/.yaml`. Use plugins to add more, e.g {@link https://github.com/ardhi/bajo-config|bajo-config}
     * lets you to use `.toml`.
     * @type {Array<App.TConfigHandler>}
     */
    this.configHandlers = []

    /**
     * Gives you direct access to the most commonly used 3rd party library in a Bajo based app.
     * No manual import necessary, always available, anywhere, anytime!
     *
     * @type {App.TLib}
     * @example
     * const { camelCase, kebabCase } = this.app.lib._
     * console.log(camelCase('Elit commodo sit et aliqua'))
     */
    this.lib = lib
    this.lib.outmatchNs = this.lib.outmatchNs.bind(this)
    this.lib.parseObject = this.lib.parseObject.bind(this)

    /**
     * Instance of system log.
     *
     * @type {Log}
     */
    this.log = {}

    /**
     * All plugin's base class are saved here as key-value pairs with plugin name as its key.
     * The special key `Base` && `Tools` is for {@link Base} & {@link Tools} class so that anytime you want to
     * create your own plugin, you can just write something like this:
     *
     * `javascript
     * class MyPlugin extends this.app.baseClass.Base {
     *   ... your class
     * }
     *
     * @type {Object}
     */
    this.baseClass = { Base, Tools }

    /**
     * If app runs in applet mode, this will be the applet's name.
     * @type {string}
     */
    this.applet = undefined

    /**
     * Parsed program arguments.
     * @type {string[]}
     * @see module:Helper.parseArgsArgv
     * @example
     * $ node index.js arg1 arg2
     * ...
     * console.log(this.args) // it should print: ['arg1', 'arg2']
     */
    this.args = []

    /**
     * Parsed program options.
     *
     * - Dash (`-`) breaks the string into object keys
     * - While colon (`:`) is used as namespace separator. If no namespace found, it is saved under `_` key.
     *
     * Values are parsed automatically. See {@link https://github.com/ladjs/dotenv-parse-variables|dotenv-parse-variables}
     * for details.
     *
     * @type {Object}
     * @see module:Helper.parseArgsArgv
     * @example
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
     */
    this.argv = {}

    /**
     * Environment variables. Support dotenv (`.env`) file too!
     *
     * - Underscore (`_`) translates key to camel-cased one
     * - Double underscores (`__`) breaks the key into object keys
     * - While dot (`.`) is used as namespace separator. If no namespace found, it is saved under `_` key.
     *
     * Values are also parsed automatically using {@link https://github.com/ladjs/dotenv-parse-variables|dotenv-parse-variables}.
     *
     * E.g.:
     *
     * - `MY_KEY=secret` → `{ _: { myKey: 'secret' } }`
     * - `MY_KEY__SUB_KEY=supersecret` → `{ _: { myKey: { subKey: 'supersecret' } } }`
     * - `MY_NS.MY_NAME=John` → `{ myNs: { myName: 'John' } }`
     *
     * @type {Object}
     * @see module:Helper.parseEnv
     */
    this.envVars = {}

    /**
     * Placeholder for boxen that will get imported from `bajoCli` later during boot process.
     * @type {Object}
     */
    this.boxen = null

    /**
     * Cache instance. This is used to store temporary data in memory for faster access.
     * @type {Cache}
     */
    this.cache = new Cache(this)

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
   * Add and save plugin and it's base class definition (if provided).
   *
   * @method
   * @param {TPlugin} plugin - A valid bajo plugin.
   * @param {Object} [baseClass] - Base class definition.
   */
  addPlugin = (plugin, baseClass) => {
    if (this[plugin.ns]) throw new Error(`Plugin '${plugin.ns}' added already`)
    this[plugin.ns] = plugin
    if (baseClass) this.baseClass[pascalCase(plugin.ns)] = baseClass
  }

  /**
   * Get all loaded plugin namespaces.
   *
   * @method
   * @returns {string[]}
   */
  getAllNs = () => {
    return this.pluginPkgs.map(pkg => camelCase(pkg))
  }

  /**
   * Get loaded plugins.
   *
   * @method
   * @param {string[]} [nss] - Array of namespaces. If empty, it returns all loaded plugins.
   * @returns {TPlugin[]}
   */
  getPlugins = (nss) => {
    const allNs = nss ?? this.getAllNs()
    return allNs.map(ns => this[ns])
  }

  /**
   * Get all plugins loaded plugins.
   *
   * @method
   * @returns {TPlugin[]}
   */
  getAllPlugins = () => {
    return this.getPlugins()
  }

  /**
   * Get plugin by its namespace.
   *
   * @method
   * @param {string} name - Plugin name/namespace or alias.
   * @param {boolean} [silent] - If `true`, silently return undefined even on error.
   * @returns {Object} Plugin object.
   */
  getPlugin = (name, silent) => {
    if (!this[name]) {
      // alias?
      let plugin
      for (const key in this) {
        const item = this[key]
        if (item instanceof Plugin && (item.alias === name || item.pkgName === name)) {
          plugin = item
          break
        }
      }
      if (!plugin) {
        if (silent) return false
        throw this.bajo.error('pluginWithNameAliasNotLoaded%s', name)
      }
      name = plugin.ns
    }
    return this[name]
  }

  /**
   * Get plugin data directory
   *
   * @method
   * @param {string} name - Plugin name (namespace) or alias.
   * @param {boolean} [ensureDir=true] - Set `true` (default) to ensure directory is existed.
   * @returns {string}
   */
  getPluginDataDir = (name, ensureDir = true) => {
    const { fs } = this.lib
    const plugin = this.getPlugin(name)
    const dir = `${this.bajo.dir.data}/plugins/${plugin.ns}`
    if (ensureDir) fs.ensureDirSync(dir)
    return dir
  }

  /**
   * Resolve file path from:
   *
   * - local/absolute file
   * - TNsPath (`myPlugin:/path/to/file.txt`)
   * - file under node_modules, e.g. `myPlugin:node_modules/some-package/file.txt`
   *
   * @method
   * @param {string} file - File path, see above for supported types.
   * @returns {string} Resolved file path.
   */
  getPluginFile = (file) => {
    const { currentLoc } = this.lib.aneka
    const { fs } = this.lib
    const { trim } = this.lib._
    if (!this) return file
    if (file[0] === '.') file = `${currentLoc(import.meta).dir}/${trim(file.slice(1), '/')}`
    if (file.includes(':')) {
      if (file.slice(1, 2) === ':') return file // windows fs
      const { ns, path } = this.bajo.breakNsPath(file, false)
      if (ns !== 'file' && this && this[ns] && ns.length > 1) {
        file = `${this[ns].dir.pkg}${path}`
        if (path.startsWith('node_modules/')) {
          file = `${this[ns].dir.pkg}/${path}`
          if (!fs.existsSync(file)) file = `${this[ns].dir.pkg}/../${path.slice('node_modules/'.length)}`
        }
      }
    }
    return file
  }

  /**
   * Dumping variable on screen. Like `console.log` with configurable options. Useful for quick debugging and testing. You can also use it to dump variables in production without worrying about performance because it is using Bajo's built-in cache to store the result of util's inspect, so it will only be processed once for each unique variable.
   *
   * Any argument passed to this method will be displayed on screen.
   * If the last argument is a boolean `true`, app will quit rightaway after dumping.
   *
   * If you have `bajoCli` plugin installed, variables will be displayed in a nice box using `boxen` package.
   * Otherwise, it will fallback to `console.log` with util's inspect result.
   *
   * To have more control on how the variable is displayed, you can set options in Bajo's config under `dump` key.
   * See {@link Bajo#config} for details.
   *
   * @method
   * @param  {...any} args - Variables to dump.
   */
  dump = (...args) => {
    let caller = getCallerFilename()
    caller = caller ? fileURLToPath(caller) : 'Unavailable'
    const opts = last(args)
    const terminate = isPlainObject(opts) && opts.abort
    if (terminate) args.pop()
    const value = args.length === 1 ? args[0] : args
    const options = { ...this.bajo.config.dump }
    if (this.boxen) {
      const result = util.inspect(value, options)
      const opts = { ...this.bajo.config.dump.frame }
      if (options.caller) opts.title = `Caller: ${caller}`
      console.log(this.boxen(result, opts))
    } else {
      const result = util.inspect(options.caller ? [caller, value] : value, options)
      console.log(result)
    }
    if (terminate) process.exit('1')
  }

  /**
   * Run application:
   *
   * - Parsing {@link module:Helper.parseArgsArgv|program arguments, options} and {@link module:Helper.parseEnv|environment values}
   * - Create {@link Bajo|Bajo} instance & initialize it
   * - {@link module:Helper/Bajo.runAsApplet|Run in applet mode} if `-a` or `--applet` is given
   *
   * After boot process is completed, event `bajo:afterBootCompleted` is emitted.
   *
   * If app mode is `applet`, it runs your choosen applet instead.
   *
   * @async
   * @method
   * @returns {Promise<App>} App instance.
   */
  run = async () => {
    this.bajo = new Bajo(this)
    this.configHandlers = [
      { ns: 'bajo', ext: '.js', readHandler: this.bajo.fromJs },
      { ns: 'bajo', ext: '.json', readHandler: this.bajo.fromJson, writeHandler: this.bajo.toJson },
      { ns: 'bajo', ext: '.yaml', readHandler: this.bajo.fromYaml, writeHandler: this.bajo.toYaml },
      { ns: 'bajo', ext: '.yml', readHandler: this.bajo.fromYml, writeHandler: this.bajo.toYml }
    ]

    const hooks = (this.options.hooks ?? []).map(item => {
      item.src = item.src ?? 'bajo'
      return item
    })
    this.bajo.hooks.push(...hooks)
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
    if (this.bajoCli) this.boxen = await this.bajo.importPkg('bajoCli:boxen')
    // cache
    this.cache.purge()
    setInterval(this.cache.purge, this.bajo.config.cache.purgeIntvDur)
    // boot complete
    const elapsed = new Date() - this.runAt
    this.bajo.log.debug('bootCompleted%s', secToHms(elapsed, true))
    await this.bajo.runHook('bajo:afterBoot')
    if (this.applet) await runAsApplet.call(this.bajo)
    return this
  }

  /**
   * Terminate the app and back to console.
   *
   * @method
   * @param {string|boolean} [signal=SIGINT] - Signal to send. Set to `true` to terminate immediately without sending any signal.
   */
  exit = (signal = 'SIGINT') => {
    if (signal === true) process.exit('1')
    process.kill(process.pid, signal)
  }

  /**
   * Load internationalization & languages files for particular plugin.
   *
   * @method
   * @param {string} ns - Plugin name (namespace)
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
   * Prepare translation text and parameters for translation.
   *
   * @method
   * @private
   * @param {string} ns
   * @param {string} text
   * @param {Array} params
   * @returns {Object}
   */
  _prepTrans = (ns, text, params) => {
    const { fallback, supported } = this.bajo.config.intl
    const { isSet } = this.lib.aneka
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
      if (isSet(trans)) break
    }
    if (!isSet(trans)) {
      for (const p of plugins) {
        const store = get(this, `${p}.intl.${fallback}`, {})
        trans = get(store, text)
        if (isSet(trans)) break
      }
    }
    return { ns, text, lang, params, plugins, trans }
  }

  /**
   * Translate text and interpolate with given `params`.
   *
   * If the last parameter is an object with `lang` key, it will use that language instead of the default one.
   *
   * There is a shortcut to this method attached on all plugins. You'll normally call that shorcut
   * instead of this method, because it is bound to plugin's namespace already
   *
   * @method
   * @param {string} ns - Namespace
   * @param {string} text - Text to translate
   * @param  {...any} params - Arguments
   * @returns {string}
   * @example
   * ... within your main plugin
   * const translated = this.app.t('main', 'My cute cat is %s', 'purring')
   * // or within your plugin
   * const translated = this.t('My cute cat is %s', 'purring')
   */
  t = (ns, text, ...params) => {
    const { formatText, isSet } = this.lib.aneka
    const { isArray, last } = this.lib._
    const { join } = this.bajo
    let { text: newText, trans, params: args } = this._prepTrans(ns, text, params)
    if (!isSet(trans)) trans = newText
    const lang = isPlainObject(last(args)) ? last(args).lang : undefined
    for (const idx in args) {
      const arg = args[idx]
      if (isArray(arg)) args[idx] = join(arg, { lang })
    }
    return formatText(trans, ...args)
  }

  /**
   * Check whether translation text/key exists.
   *
   * @method
   * @param {string} ns - Namespace
   * @param {string} text - Text to translate
   * @returns {boolean}
   */
  te = (ns, text, ...params) => {
    const { trans } = this._prepTrans(ns, text, params)
    return !!trans
  }

  /**
   * Helper method to list all supported config formats.
   *
   * @method
   * @param {boolean} [noDot] - If `true`, it will return the list without dot prefix
   * @returns {string[]}
   */
  getConfigFormats = (noDot) => {
    const formats = map(this.configHandlers, 'ext')
    return noDot ? formats.map(f => f.slice(1)) : formats
  }

  /**
   * Start a plugin.
   *
   * @method
   * @param {string} ns - Plugin namespace.
   * @param  {...any} args - Arguments to pass to the plugin's start method
   */
  startPlugin = (ns, ...args) => {
    this[ns].start(...args)
  }

  /**
   * Stop a plugin.
   *
   * @method
   * @param {string} ns - Plugin namespace.
   * @param  {...any} args - Arguments to pass to the plugin's stop method
   */
  stopPlugin = (ns, ...args) => {
    // Disabled for now, reserved for future use. It is not a good idea to stop a plugin because other plugins might be dependent on it.
    // this[ns].stop(...args)
  }
}

export default App
