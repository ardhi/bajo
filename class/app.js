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
 * Supported environments.
 *
 * Environment is one of the most important aspect of a Bajo app. It is used to determine how your app should behave
 * in different environments. It allows you to have different configurations and settings,
 * and as a plugin developer, you can also use it to determine how your plugin should behave in different environments.
 *
 * @typedef {Object} TEnv
 * @memberof App
 * @property {string} dev=development
 * @property {string} stag=staging
 * @property {string} prod=production
 * @property {string} test=testing
 */

/**
 * Your read handler must follow this structure. It is used to read and parse config file in a particular format.
 *
 * @callback readHandler
 * @memberof App
 * @async
 * @param {string} text - Text to be parsed or file path to be read if `options.readFromFile` is `true`
 * @param {object|boolean} [options={}] - Options object. If a boolean is provided, it will be treated as `options.readFromFile`
 * @param {boolean} [options.readFromFile=false] - If `true`, `text` is treated as a file path
 * @param {boolean} [options.throwNotFound=false] - If `true`, throw exception if file is not found
 * @param {object} [options.parserOpts={}] - Options to be passed to the parser
 * @returns {object} Parsed object
 */

/**
 * Your write handler must follow this structure. It is used to write config file in a particular format.
 *
 * @callback writeHandler
 * @async
 * @memberof App
 * @param {Object} data - Data to be stringified
 * @param {Object|string} [options={}] - Options object. If a string is provided, it will be treated as `options.writeToFile`
 * @param {string} [options.writeToFile] - If not empty, write result to this file path instead of returning it as string
 * @param {object} [options.parserOpts={}] - Options to be passed to the parser
 * @returns {string} Stringified result
 */

/**
 * Config handler definition. Your own handler must follow this structure.
 *
 * @typedef {Object} TConfigHandler
 * @memberof App
 * @property {string} ns - Owner plugin namespace
 * @property {string} ext - Supported file extension
 * @property {App.readHandler} [readHandler] - Async function to call for reading
 * @property {App.writeHandler} [writeHandler] - Async function to call for writing
 * @see {@link App#configHandlers}
 */

/**
 * Options object passed to {@link App} constructor. By default, you don't need to pass any options,
 * unless you want to manually override the default behavior.
 * @typedef {Object} TOptions
 * @memberof App
 * @property {string} [cwd] - Set current working directory. Defaults to the script directory
 * @property {string[]} [plugins] - Array of plugins **package names** to load. If provided, it override the list in `package.json` and `.plugins` file
 * @property {Object} [config] - Plugin config objects, with plugin name as keys and their respective config objects as values. If provided, plugin configs will no longer be read from its config files
 * @property {module:Hook.THook[]} [hooks] - Array of hooks to be added to the app
 * @example
 * // If you feel adventurous and decide to manually boot your app without the default boot module, here we go,,,
 * import App from 'bajo/class/app.js'
 *
 * const options = {
 *   plugins: ['my-plugin', 'my-other-plugin'],
 *   config: {
 *     myPlugin: {
 *       // plugin config here
 *     },
 *     myOtherPlugin: {
 *       // plugin config here
 *     }
 *    },
 *    hooks: [{
 *      name: 'myPlugin:myHook',
 *      handler: async function (arg1, arg2) {
 *        // do something with arg1 and arg2
 *      }
 *    }]
 *   }
 * }
 *
 * const app = new App(options)
 */

/**
 * App class. This is the root. This is where all plugins call it home.
 *
 * This class should not be instantiated directly (see example in {@link App.TOptions} if you
 * feel adventurous). Instead, use the default {@link boot|boot} script.
 *
 * Plugins (including special plugins {@link Main} and {@link Bajo}) are loaded and attached as
 * property members of this class. They can be accessed using their name/namespace.
 *
 * In every plugin there is a reference to this class instance, so they can call each other easily,
 * e.g. in your plugin method, you would call other plugin's method like this `this.app.otherPlugin.method()`.
 *
 * A typical Bajo app should follow the following structure:
 * ```
 * my-app
 * ├── package.json
 * ├── index.js
 * ├── main
 * │   ├── extend
 * │   │   ├── bajo
 * │   │   │   ├── hook
 * │   │   │   │   ├── my-plugin@before-action.js
 * │   │   │   │   └── my-other-plugin.domain@after-action.js
 * │   │   │   └── intl
 * │   │   │       ├── en-US.yml
 * │   │   │       └── id.yml
 * │   │   └── myPlugin
 * │   ├── index.js
 * ├── data
 * │   ├── config
 * │   │   ├── .plugins
 * │   │   ├── bajo.yml
 * │   │   ├── myPlugin.yml
 * •   •   •   •
 * ```
 *
 * @class
 */
class App {
  /**
   * Constructor. See {@link App.TOptions} if you want to write custom boot process for your app without using the default boot module.
   * @param {App.TOptions} [options={}] - Options object.
   */
  constructor (options = {}) {
    /**
     * Copy of the provided options. See {@link App.TOptions} for details.
     * @type {App.TOptions}
     */
    this.options = options

    /**
     * App's main plugin namespace (`main`). Read-only
     * @type {string}
     */
    this.mainNs = 'main'

    /**
     * Supported environments. Read-only
     * @type {App.TEnv}
     */
    this.envs = { dev: 'development', prod: 'production', stag: 'staging', test: 'testing' }

    /**
     * Date/time when your app start. You can use this e.g. to calculate how long your app has been running. Read-only
     * @type {Date}
     */
    this.runAt = new Date()

    /**
     * Applets container. Usefull to get all available applets in your app. See {@link module:Applet|applet} for details.
     * @type {Array}
     */
    this.applets = []

    /**
     * Original plugin's **package names** (not to be confused with plugin namespaces) container. Ypu can use this
     * information to get the real package name of a plugin.
     *
     * > **Reminder**: In Bajo, plugin name/namespace is the camel-cased version of its package name.
     * E.g. `my-plugin` → `myPlugin`.
     *
     * @type {string[]}
     */
    this.pluginPkgs = options.plugins ?? []

    /**
     * Config handlers container. This is where all config handlers are stored. Each handler
     * is responsible to read and write config file in a particular format. Bajo uses this heavily to read/write config
     * files and/or anything that needs to be parsed/stringified from string to object and vice versa.
     *
     * By default, there are three built-in handlers: `.js`, `.json`
     * and `.yml/.yaml`. Use plugins to add more, e.g {@link https://github.com/ardhi/bajo-config|bajo-config}
     * lets you to use `.toml`.
     *
     * > *Note*: `.js` is for reading only, it cannot be used to write config file.

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
    this.lib.lockFile = this.lib.lockFile.bind(this)
    this.lib.unlockFile = this.lib.unlockFile.bind(this)
    this.lib.setInterval = this.lib.setInterval.bind(this)

    /**
     * Instance of the system log. This will automatically be instantiated early during boot process. See {@link Log} for details.
     * @type {Log}
     */
    this.log = {}

    /**
     * All plugin's base classes are saved here for reference so that you can extend them in your own plugins.
     *
     * Two basic classes from Bajo package are also provided: {@link Base} and {@link Tools}. These are the most
     * used classes in Bajo plugin development. You can extend them to create your own plugin's base class:
     *
     * ```javascript
     * // factory function to create your own plugin's base class
     * async function () {
     *   const { Base } = this.app.baseClass
     *   class MyBase extends Base {
     *     constructor(pkgName, app) {
     *       super(pkgName, app)
     *       this.myProperty = 'myValue' // your class property
     *     }
     *
     *     async myMethod() {
     *       // your class method
     *     }
     *   }
     * }
     * ```
     *
     * @type {Object}
     */
    this.baseClass = { Base, Tools }

    /**
     * If app runs in **applet** mode, this will be the current applet's name. Otherwise, it will be `undefined`. See {@link module:Applet|applet} for details.
     * @type {string}
     */
    this.applet = undefined

    /**
     * Parsed program arguments.
     *
     * Example:
     * ```js
     * $ node index.js arg1 arg2
     * ...
     * console.log(this.args) // it should print: ['arg1', 'arg2']
     * ```
     *
     * @type {string[]}
     */
    this.args = []

    /**
     * Parsed program options:
     * - Dash (`-`) breaks the string into object keys
     * - While colon (`:`) is used as namespace - object separator. If no such namespace found, it is saved under `_`.
     *
     * Parsed object values are normalized to its primitives using {@link https://github.com/ladjs/dotenv-parse-variables|dotenv-parse-variables}
     *
     * ```js
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
     *
     * @type {Object}
     */
    this.argv = {}

    /**
     * Parsed environment variables. Support dotenv (`.env`) file too!
     * - Underscore (`_`) between keys merge those keys into a single camel-cased key
     * - Double underscores (`__`) between keys breaks the key into nested objects
     * - Meanwhile a dot (`.`) between keys breaks the key into nested, name-spaced objects
     *
     * Parsed object values are normalized to its primitives using {@link https://github.com/ladjs/dotenv-parse-variables|dotenv-parse-variables}
     *
     * Example:
     * - `MY_KEY=secret` → `{ _: { myKey: 'secret' } }`
     * - `MY_KEY__SUB_KEY=supersecret` → `{ _: { myKey: { subKey: 'supersecret' } } }`
     * - `MY_NS.MY_NAME=John` → `{ myNs: { myName: 'John' } }`
     *
     * > **Tips**: During boot process, Bajo will add `APPDIR` environment variable which points to your app's root directory.
     *
     * @type {Object}
     */
    this.envVars = {}
    this.boxen = null

    /**
     * Internal cache instance. This is used to store temporary data in memory for faster access.
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
   * Add and save plugin and its base class definition (if provided) to the app instance. You can then reference
   * the plugin using its namespace, e.g. `this.myPlugin` or `this['myPlugin']`.
   *
   * @method
   * @param {Base} plugin - A valid Bajo plugin.
   * @param {class} [baseClass] - Base class definition.
   */
  addPlugin = (plugin, baseClass) => {
    if (this[plugin.ns]) throw new Error(`Plugin '${plugin.ns}' added already`)
    this[plugin.ns] = plugin
    if (baseClass) this.baseClass[pascalCase(plugin.ns)] = baseClass
  }

  /**
   * Get all loaded **plugin namespaces**.
   *
   * @method
   * @returns {string[]}
   */
  getAllNs = () => {
    return this.pluginPkgs.map(pkg => camelCase(pkg))
  }

  /**
   * Get loaded plugins by their namespaces. If no namespace is provided, it will return all loaded plugins.
   *
   * @method
   * @param {string[]} [nss] - Array of namespaces. If empty, it returns all loaded plugins
   * @param {boolean} [nameOnly=false] - If `true`, it will return only the plugin namespaces instead of the plugin instances
   * @returns {Array<Base>} Array of plugin instances
   */
  getPlugins = (nss, nameOnly = false) => {
    const allNs = nss ?? this.getAllNs()
    return allNs.map(ns => nameOnly ? ns : this[ns])
  }

  /**
   * Get all loaded plugins. Alias to {@link App#getPlugins|getPlugins()} with no namespace provided.
   *
   * @method
   * @returns {Array<Base>} Array of all loaded plugin instances
   */
  getAllPlugins = () => {
    return this.getPlugins()
  }

  /**
   * Get plugin by its namespace or alias. If the plugin is not loaded, it will throw an error
   * unless `silent` is set to `true`.
   *
   * @method
   * @param {string} name - Namespace or alias.
   * @param {boolean} [silent] - If `true`, silently return undefined even on error
   * @returns {Base} Plugin object.
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
        if (silent) return undefined
        throw this.bajo.error('pluginWithNameAliasNotLoaded%s', name)
      }
      name = plugin.ns
    }
    return this[name]
  }

  /**
   * Get plugin data directory. If the directory does not exist, it will be created automatically
   * unless `ensureDir` is set to `false`.
   *
   * @method
   * @param {string} name - Namespace or alias.
   * @param {boolean} [ensureDir=true] - Set `true` (default) to ensure directory exists
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
   * - local/absolute file
   * - {@link Bajo.TNsPathPairs} e.g. `myPlugin:/path/to/file.txt`
   * - file under `node_modules`, e.g. `myPlugin:node_modules/some-package/file.txt`
   *
   * @method
   * @param {string} file - File path, see above for supported types
   * @returns {string} Resolved file path
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
   * Dumping variable on screen. Like `console.log` with configurable options. Useful for quick debugging and testing.
   * You can also use it to dump variables in production without worrying about performance because it is
   * using Bajo's built-in cache to store the result of util's inspect,
   * so it will only be processed once for each unique variable.
   *
   * Any argument passed to this method will be displayed on screen.
   * If the last argument is a string `\q` or `.q`, app will quit rightaway after dumping.
   *
   * If you have `bajoCli` plugin installed, variables will be displayed in a nice box using `boxen` package.
   * Otherwise, it will fallback to `console.log` with util's inspect result.
   *
   * To have more control on how the variable is displayed, you can set options in Bajo's config under `dump` key.
   * See {@link Bajo.TConfig} for details.
   *
   * @method
   * @param  {...any} args - Variables to dump.
   */
  dump = (...args) => {
    let caller = getCallerFilename()
    caller = caller ? fileURLToPath(caller) : 'Unavailable'
    const terminate = ['\\q', '.q'].includes(last(args))
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
   * Run application and begin the boot process. This method is called automatically by {@link boot|boot} script.
   *
   * Boot process includes:
   * - parsing environment values, program arguments, and options
   * - create {@link Bajo|Bajo} instance & initialize it
   * - load all plugins, their hooks, their configs and any other necessary services & resources
   * - {@link Bajo.runAsApplet|run in applet mode} if `-a` or `--applet` is given
   *
   * After boot process is completed, hook `bajo:afterBoot` is triggered.
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
    if (get(this, 'envVars._.env') === '[object Object]') set(this, 'envVars._.env', 'dev') // hack for some env vars that are not parsed correctly
    this.applet = this.envVars._.applet ?? this.argv._.applet
    await this.bajo.runHook('bajo:beforeBoot')
    await this.bajo.bootApp()
    if (this.bajoCli) this.boxen = await this.bajo.importPkg('bajoCli:boxen')
    // cache
    this.cache.purge()
    await this.lib.setInterval(this.cache.purge, this.bajo.config.cache.purgeIntvDur, { lockFile: 'cachePurge', scope: this })
    // boot complete
    const elapsed = new Date() - this.runAt
    this.bajo.log.debug('bootCompleted%s', secToHms(elapsed, true))
    await this.bajo.runHook('bajo:afterBoot')
    if (this.applet) await runAsApplet.call(this.bajo)
    return this
  }

  /**
   * Terminate the app forcefully and back to console.
   *
   * @method
   * @param {string|boolean} [signal=SIGINT] - Signal to send. Set to `true` to terminate immediately without sending any signal
   * @param {string} [reason] - Reason to be printed on console before exiting
   */
  exit = (signal = 'SIGINT', reason) => {
    if (reason) console.error(reason)
    if (signal === true) process.exit('1')
    process.kill(process.pid, signal)
  }

  /**
   * Load internationalization & languages files for particular plugin by its namespace.
   * It will load all supported languages defined in {@link Bajo.TConfig|`config.intl.supported`}
   * and save them in `this[ns].intl` object.
   *
   * @method
   * @param {string} ns - Plugin namespace
   */
  loadIntl = async (ns) => {
    this[ns].intl = {}
    for (const lang of this.bajo.config.intl.supported) {
      this[ns].intl[lang] = {}
      const path = `${this[ns].dir.pkg}/extend/bajo/intl/${lang}.*`
      this[ns].intl[lang] = await this.bajo.readConfig(path, { throwNotFound: false })
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
   * Translate text to the current language.
   *
   * It will search for the translation in the plugin's `intl` object first, interpolating the parameters if found,
   * then fallback to `bajo` plugin's `intl` object if not found.
   *
   * If the last parameter is an object with `lang` key, it will use that language instead of the default one.
   *
   * There is a shortcut to this method attached on all plugins. You'll normally call that shorcut
   * instead of this method, because that shortcut is bound to plugin's namespace already
   *
   * ```js
   * ... within your main plugin
   * const translated = this.app.t('main', 'My cute cat is %s', 'purring')
   * // or within your plugin
   * const translated = this.t('My cute cat is %s', 'purring')
   * ```
   *
   * @method
   * @param {string} ns - Namespace
   * @param {string} text - Text to translate
   * @param  {...*} params - Parameters to interpolate into the translation text
   * @returns {string}
   */
  t = (ns, text, ...params) => {
    const { formatText, isSet } = this.lib.aneka
    const { isArray, last, get } = this.lib._
    const { join } = this.bajo
    if (!get(this, 'bajo.config.intl')) return formatText(text, ...params)
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
   * Method to list all supported config formats, that is, all file extensions that are supported
   * by the app's config handlers.
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
   * Start a plugin by its namespace. It will call the plugin's `start` method with the provided arguments.
   *
   * @method
   * @param {string} ns - Plugin namespace.
   * @param  {...any} args - Arguments to pass to the plugin's start method
   */
  startPlugin = (ns, ...args) => {
    this[ns].start(...args)
  }

  /**
   * Stop a plugin by its namespace. It will call the plugin's `stop` method with the provided arguments.
   *
   * Reserved for future use.
   *
   * > **Note**: Basically it is not a good idea to stop a plugin because other plugins
   * might be dependent on it. But if we could find a way to safely stop a plugin without breaking things,
   * this will be a cool feature because it allows dynamic management of plugins without restarting the application.
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
