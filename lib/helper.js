import Print from '../class/print.js'
import Log from '../class/log.js'
import os from 'os'
import fs from 'fs-extra'
import lodash from 'lodash'
import semver from 'semver'
import aneka from 'aneka/index.js'
import outmatch from 'outmatch'
import fastGlob from 'fast-glob'
import * as readline from 'readline/promises'
import { sprintf } from 'sprintf-js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import weekOfYear from 'dayjs/plugin/weekOfYear.js'
import defConfig from './config.js'
const { resolvePath } = aneka
const {
  isFunction, isPlainObject, cloneDeep, merge, forOwn, groupBy, find, reduce, map,
  trim, keys, intersection, each, camelCase, get, orderBy, pick, values, set,
  without, uniq, isEmpty
} = lodash

/**
 * # Helper
 *
 * Internal helpers called by Bajo and other classes. It should remains
 * hidden and not to be imported by any program. It listed here for documentation purpose only.
 *
 * @module Helper
 */

const omitted = ['spawn', 'cwd', 'name', 'alias', 'applet', 'a', 'plugins']

/**
 * Main plugin class. This is the special plugin created by Bajo during the boot process, solely made
 * for you to write your own code for your application. It behaves like any other plugin, with a few differences:
 *
 * - It always there, can't be disabled nor removed, reside in the app's root directory named `main`.
 *   If it's folder is missing, Bajo will create it during the boot process with the default template and settings.
 * - You don't have to put this plugin in your `.plugin` file or `package.json` file,
 *   it is always present and always loaded as the **last** plugin to load.
 * - You write your app the same way you would do it with plugin:
 *   - by creating properties & methods within your class
 *   - by extending other plugins inside `/main/extend/{pluginNs}` folder
 *   - by tapping hooks inside `/main/extend/bajo/hook` folder or `/main/extend/bajo/hook.js` file
 *   - you even have your own config file in `{dataDir}/config/main.{ext}`
 *
 * Why it has to be a plugin? Because Bajo is a plugin-based framework, and everything is a plugin.
 * This brings some flexibilities, e.g. when someday you think your main plugin become too big,
 * just turn it into a separate plugin and move it to its own package with almost no code changes at all.
 *
 * For more on this, see {@link Plugin} and {@link module:Hook}
 *
 * @class
 * @global
 * @name Main
 */
const defMain = `async function factory (pkgName) {
  const me = this

  return class Main extends this.app.baseClass.Base {
    constructor () {
      super(pkgName, me.app)
      this.config = {}
    }
  }
}

export default factory
`

/**
 * Outmacth with support for scoped source and pattern. Scoped source/pattern is a source/pattern that has a plugin's namespace prefix,
 * separated by `:` symbol.
 *
 * This function is usefull for matching a source/pattern that is scoped to a specific plugin's namespace.
 * For example, if you have a source `myPlugin:foo/bar` and a pattern `myPlugin:foo/*`,
 * this function will return `true` because the source matches the pattern within the same namespace.
 *
 * @param {string} source - Scoped source to match against the pattern. It should be in the format of `ns:path`
 * @param {string} pattern - Scoped pattern to match against the source. It should be in the format of `ns:path`
 * @returns {boolean} Returns `true` if the source matches the pattern, otherwise `false`.
 */
export function outmatchNs (source, pattern) {
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
 * Parse object and normalize their values.
 *
 * Support automatic value translation for keys with `t:` prefix. The keys are then
 * converted to the one without the `t:` prefix, and the original key is removed from the object.
 *
 * See {@link https://ardhi.github.io/aneka/global.html#parseObject|aneka.parseObject()} for more details.
 *
 * @method
 * @param {*} obj - The object to parse and normalize.
 * @param {object} [options={}] - Options for parsing and translation.
 * @returns {object} The parsed and normalized object.
 */
export function parseObject (obj, options = {}) {
  const me = this
  const { ns = 'bajo', lang } = options
  options.translator = {
    lang,
    prefix: 't:',
    handler: val => {
      const [text, ...args] = val.split('|')
      args.push({ lang })
      return me[ns].t(text, ...args)
    }
  }
  return aneka.parseObject(obj, options)
}

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(localizedFormat)
dayjs.extend(weekOfYear)

/**
 * Most commonly used libraries by Bajo and its plugins. They are already imported and ready to use,
 * so you don't have to import them again in your plugin.
 *
 * Example:
 * ```javascript
 * const { fs, dayjs } = this.app.lib
 * fs.ensureDirSync('/path/to/dir')
 * const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
 * ```
 * @typedef {Object} TLib
 * @memberof App
 * @property {Object} _ Access to {@link https://lodash.com|lodash}.
 * @property {Object} fs Access to {@link https://github.com/jprichardson/node-fs-extra|fs-extra}.
 * @property {Object} fastGlob Access to {@link https://github.com/mrmlnc/fast-glob|fast-glob}.
 * @property {Object} sprintf Access to {@link https://github.com/alexei/sprintf.js|sprintf}.
 * @property {Object} aneka Access to {@link https://github.com/ardhi/aneka|aneka}.
 * @property {Object} outmatch Access to {@link https://github.com/axtgr/outmatch|outmatch}.
 * @property {Object} dayjs Access to {@link https://day.js.org|dayjs} with utc & customParseFormat plugin already applied.
 * @property {Object} freeze Freeze object. See {@link module:Helper.freeze|freeze} for more details.
 * @property {Object} findDeep Deep file file in an array of files. See {@link module:Helper.findDeep|findDeep} for more details.
 * @property {Object} outmatchNs Like outmatch, but support scoped source & pattern. See {@link module:Helper.outmatchNs|outmatchNs} for more details.
 * @property {Object} parseObject Parse object and normalize their values. Also support translation. See {@link module:Helper.parseObject|parseObject} for more details.
 * @property {Object} [anekaSpatial] Access to {@link https://ardhi.github.io/bajo-spatial|aneka-spatial} helpers if `bajoSpatial` plugin is loaded.
 * @see App
 */
export const lib = {
  _: lodash,
  fs,
  fastGlob,
  sprintf,
  outmatch,
  dayjs,
  aneka,
  freeze,
  findDeep,
  outmatchNs,
  parseObject
}

export async function ask (question, ...args) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  let answer
  try {
    answer = await rl.question(this.t(question, ...args))
  } catch (err) {
    console.error(err)
  } finally {
    rl.close()
  }
  return answer
}

/**
 * Ensure the existence of necessary directories for Bajo. This function is called by Bajo
 * during the {@link Bajo#init|initialization process}:
 * - it sets up the base directory,
 * - it checks the validity of the data directory,
 * - it ensures the temporary directory exists,
 *
 * @async
 * @method
 */
export async function ensureDirs () {
  const { defaultsDeep, currentLoc, resolvePath } = this.app.lib.aneka
  this.config = defaultsDeep({}, this.app.envVars._, this.app.argv._)
  set(this, 'dir.base', this.app.dir)
  const path = currentLoc(import.meta).dir + '/..'
  set(this, 'dir.pkg', resolvePath(path))
  if (get(this, 'config.dir.data')) set(this, 'dir.data', this.config.dir.data)
  if (!get(this, 'dir.data')) set(this, 'dir.data', `${this.dir.base}/data`)
  this.dir.data = resolvePath(this.dir.data)
  if (!fs.existsSync(this.dir.data)) {
    console.error("Data directory does not exist: '%s'", this.dir.data)
    let answer
    do {
      answer = await ask.call(this, 'Create one now? (y/n) ', this.dir.data)
      answer = answer.trim().toLowerCase()
    } while (!['y', 'n'].includes(answer))
    if (answer === 'n') this.app.exit(true, 'Aborted')
    fs.ensureDirSync(this.dir.data)
  }
  fs.ensureDirSync(`${this.dir.data}/config`)
  if (!this.dir.tmp) {
    this.dir.tmp = `${resolvePath(os.tmpdir())}/${this.ns}`
    fs.ensureDirSync(this.dir.tmp)
  }
}

/**
 * Collect all plugins defined in `package.json` or `.plugins` file, and add them to the
 * app's plugin list. It will also make sure the `main` plugin is there too, if not, it will be
 * created with the default template and settings.
 */
export async function collectPlugins () {
  const { textToArray } = this.app.lib.aneka
  this.pkg = await this.getPkgInfo()
  let pluginPkgs = this.app.pluginPkgs
  if (isEmpty(pluginPkgs)) {
    const mainPkg = await this.getPkgInfo(this.app.dir)
    pluginPkgs = get(mainPkg, 'bajo.plugins', [])
    if (isEmpty(pluginPkgs)) {
      const pluginsFile = `${this.dir.data}/config/.plugins`
      if (fs.existsSync(pluginsFile)) {
        pluginPkgs = textToArray(fs.readFileSync(pluginsFile, 'utf8'))
      }
    }
  }
  this.app.pluginPkgs = without(uniq(pluginPkgs), this.app.mainNs)
  this.app.pluginPkgs.push(this.app.mainNs)
}

/**
 * Load, build and sanitize all plugins defined in `package.json` or `.plugins` file, and add them to the app's plugin list.
 * It will also make sure the `main` plugin is there too, if not, it will be created with the default template and settings.
 *
 * Finally, it will loop through all loaded plugins and its config and language files.
 *
 * This function is called by Bajo during the {@link Bajo#init|initialization process}.
 * @async
 */
export async function buildPlugins () {
  const { resolvePath } = this.app.lib.aneka
  this.log.trace('buildPluginsStart')
  for (const pkg of this.app.pluginPkgs) {
    const ns = camelCase(pkg)
    let dir
    if (ns === 'main') {
      dir = `${this.dir.base}/${this.app.mainNs}`
      fs.ensureDirSync(dir)
      if (!fs.existsSync(`${dir}/index.js`)) {
        fs.writeFileSync(`${dir}/index.js`, defMain, 'utf8')
      }
    } else dir = this.getModuleDir(pkg)
    const factory = `${dir}/index.js`
    if (!fs.existsSync(factory)) throw this.error('pluginPackageNotFound%s', pkg)
    const { default: builder } = await import(resolvePath(factory, true))
    const ClassDef = await builder.call(this, pkg)
    const plugin = new ClassDef()
    if (!(plugin instanceof this.app.baseClass.Base)) throw this.error('pluginPackageInvalid%s', pkg)
    plugin.pkg = plugin.getPkgInfo(ns === 'main' ? this.dir.base : dir)
    plugin.alias = ns === 'main' ? this.app.mainNs : get(plugin.pkg, 'bajo.alias', (pkg.slice(0, 5) === 'bajo-' ? pkg.slice(5) : ns).toLowerCase())
    plugin.dependencies = get(plugin.pkg, 'bajo.dependencies', [])
    this.app.addPlugin(plugin, ClassDef)
    this.log.trace('- ' + pkg)
  }
  // load all plugins' config & language files
  for (const ns of this.app.getAllNs()) {
    await this.app[ns].loadConfig()
    this.app[ns].print = new Print(this.app[ns])
    this.app.loadIntl(ns)
  }
  this.log.debug('buildPluginsComplete')
}

/**
 * Collect all plugins' config handlers and push them to the app's {@link App#configHandlers|configHandlers} array.
 * @async
 */
export async function collectConfigHandlers () {
  for (const pkg of this.app.pluginPkgs) {
    let dir
    try {
      dir = this.getModuleDir(pkg)
    } catch (err) {}
    if (!dir) continue
    const file = `${dir}/extend/bajo/config-handlers.js`
    let mod = await this.importModule(file)
    if (!mod) continue
    if (isFunction(mod)) mod = await mod.call(this.app[camelCase(pkg)])
    if (isPlainObject(mod)) mod = [mod]
    mod.forEach(m => set(m, 'ns', camelCase(pkg)))
    this.app.configHandlers = this.app.configHandlers.concat(mod)
  }
}

/**
 * Building Bajo configuration object. Called after all config handlers are collected,
 * this function will read config files written in any of config handlers' supported formats:
 * - if runtime configuration object is provided (the one passed to the app constructor), it will be
 *   used as the base. Otherwise, files are read from the `{dataDir}/config`
 * - then it will be merged with the configuration coming from the command line arguments and environment variables
 * - doing some normalization and validation works, including setting the language, environment, log level, and cache purge settings
 * - and setting up the app's log instance with the proper log level
 *
 * @async
 */
export async function buildConfig () {
  // config merging
  const { defaultsDeep, includes } = this.app.lib.aneka
  const { parseObject } = this.app.lib
  const { isEmpty, get, isString, without, omit } = this.app.lib._

  let resp = get(this, `app.options.config.${this.ns}`, {})
  if (isEmpty(resp)) resp = await this.readAllConfigs(`${this.dir.data}/config/${this.ns}`)
  resp = omit(pick(resp, ['log', 'exitHandler', 'env', 'runtime']), omitted)
  const envs = this.app.envs
  this.config = defaultsDeep({}, this.config, resp, defConfig)
  // language
  this.config.lang = (this.config.lang ?? '').split('.')[0]
  this.app.loadIntl(this.ns)
  this.print = new Print(this)
  // environment
  if (values(envs).includes(this.config.env)) this.config.env = this.app.lib.aneka.getKeyByValue(envs, this.config.env)
  if (!keys(envs).includes(this.config.env)) throw this.error('unknownEnv%s%s', this.config.env, this.join(keys(envs), { lastSeparator: this.t('or') }))
  process.env.NODE_ENV = envs[this.config.env]
  if (!this.config.log.level) this.config.log.level = this.config.env === 'dev' ? 'debug' : 'info'
  // misc
  const obj = this.app.applet ? this.config : pick(this.config, keys(defConfig))
  this.config = parseObject(obj, { parseValue: true })
  const exts = this.app.getConfigFormats()
  if (this.app.applet) {
    if (!this.app.pluginPkgs.includes('bajo-cli')) throw this.error('appletNeedsBajoCli')
    if (!this.config.log.applet) this.config.log.level = 'silent'
    this.config.exitHandler = false
  }
  if (this.config.runtime.noWarning) process.removeAllListeners('warning')
  if (isString(this.config.cache.purge)) this.config.cache.purge = [this.config.cache.purge]
  this.config.cache.purge = without(this.config.cache.purge, '', null, undefined)
  if (this.config.cache.purge.length > 0) {
    if (includes(['all', '*'], this.config.cache.purge)) this.app.cache.purge('*')
    else {
      for (const name of this.config.cache.purge) {
        this.app.cache.purge(name)
      }
    }
  }
  this.app.log = new Log(this.app)
  this.log.trace('dataDir%s', this.dir.data)
  this.log.debug('configHandlers%s', this.join(exts))
}

/**
 * Determine the boot order of plugins based on their `bajo.bootorder` property in their `package.json` file.
 * If not provided, the plugin will be booted in the order they are listed in the `package.json` file or `.plugins` file.
 *
 * @async
 */
export async function bootOrder () {
  const { freeze } = this.app.lib
  const { isNumber } = this.app.lib._
  this.log.debug('setupBootOrder')
  let counter = 1000
  const orders = []
  for (const pkg of this.app.pluginPkgs) {
    const item = { pkg }
    const ns = camelCase(pkg)
    const order = get(this.app[ns], 'pkg.bajo.bootorder')
    if (isNumber(order)) item.val = order
    else {
      item.val = counter
      counter++
    }
    orders.push(item)
  }
  this.app.pluginPkgs = map(orderBy(orders, ['val']), 'pkg')
  this.log.debug('runInEnv%s', this.t(this.app.envs[this.config.env]))
  // misc
  freeze(this.config)
}

/**
 * Ensure the uniqueness of all plugins' name and alias. If there is a clash, an error will be thrown.
 * @async
 */
export async function checkNameAliases () {
  this.log.debug('checkAliasNameClash')
  const refs = []
  for (const pkg of this.app.pluginPkgs) {
    const plugin = this.app[camelCase(pkg)]
    const { ns, alias } = plugin
    let item = find(refs, { ns })
    if (item) throw this.error('pluginNameClash%s%s%s%s', ns, pkg, item.ns, item.pkg, { code: 'BAJO_NAME_CLASH' })
    item = find(refs, { alias })
    if (item) throw this.error('pluginNameClash%s%s%s%s', alias, pkg, item.alias, item.pkg, { code: 'BAJO_ALIAS_CLASH' })
    refs.push({ ns, alias, pkg })
  }
}

/**
 * Ensure all plugins' dependencies are met. If there is a missing dependency, an error will be thrown.
 *
 * Semver is also supported, so if a plugin requires a specific version of another plugin, it will be checked as well.
 * @async
 */
export async function checkDependencies () {
  const { join } = this
  this.log.debug('checkDeps')
  for (const pkg of this.app.pluginPkgs) {
    const plugin = this.app[camelCase(pkg)]
    const { ns, dependencies } = plugin
    this.log.trace('- %s', ns)
    const odep = reduce(dependencies, (o, k) => {
      const item = map(k.split('@'), m => trim(m))
      if (k[0] === '@') o['@' + item[1]] = item[2]
      else o[item[0]] = item[1]
      return o
    }, {})
    const deps = keys(odep)
    if (deps.length > 0) {
      if (intersection(this.app.pluginPkgs, deps).length !== deps.length) {
        throw this.error('dependencyUnfulfilled%s%s', pkg, join(deps), { code: 'BAJO_DEPENDENCY' })
      }
      each(deps, d => {
        if (!odep[d]) return
        const ver = get(this.app[camelCase(d)], 'pkg.version')
        if (!ver) return
        if (!semver.satisfies(ver, odep[d])) {
          throw this.error('semverCheckFailed%s%s', pkg, `${d}@${odep[d]}`, { code: 'BAJO_DEPENDENCY_SEMVER' })
        }
      })
    }
  }
}

/**
 * Collect all plugins' hooks and push them to the app's {@link App#hooks|hooks} array.
 * @async
 */
export async function collectHooks () {
  const { eachPlugins, runHook, isLogInRange, importModule } = this
  const { isArray, isPlainObject } = this.app.lib._
  const me = this // "this" is "bajo"
  this.log.trace('collecting%s', this.t('hooks'))
  await eachPlugins(async function ({ dir, file }) {
    let mod = await importModule(file, { asHandler: true })
    if (!mod) return undefined
    if (file.includes('hook.js')) mod = await mod.handler.call(this)
    if (isArray(mod)) {
      for (const m of mod) {
        if (!isPlainObject(m)) continue
        if (!m.name) throw me.bajo.error('missing%s%s', 'name', file)
        if (isArray(m.name)) {
          for (const name of m.name) {
            me.hooks.push(merge({}, m, { name, src: this.ns }))
          }
        } else {
          m.src = this.ns
          me.hooks.push(m)
        }
      }
    } else {
      const _file = file.replace(dir + '/hook/', '').replace('.js', '')
      let [names, path] = _file.split('@')
      names = names.split('$').map(n => trim(n))
      for (let name of names) {
        name = name.split('.').map(n => camelCase(n)).join('.')
        const m = merge({}, mod, { name: `${name}:${camelCase(path)}`, src: this.ns })
        me.hooks.push(m)
      }
    }
  }, { glob: ['hook/*.js', 'hook.js'], prefix: this.ns })
  // for log trace purpose only
  if (isLogInRange('trace')) {
    const items = groupBy(this.hooks, item => item.name)
    forOwn(items, (v, k) => {
      const [name, path] = k.split(':')
      this.log.trace('- %s:%s (%s)', name, path, v.length)
    })
  }

  await runHook('bajo:afterCollectHooks', this.hooks)
  this.log.debug('collected%s%d', this.t('hooks'), this.hooks.length)
}

/**
 * Run all loaded plugins' `init()` and `start()` methods in the order determined previously during boot process.
 *
 * @async
 * @see module:Hook
 */
export async function runPlugins () {
  const me = this
  const { runHook, eachPlugins, join } = this
  const { freeze } = this.app.lib
  const methods = ['init']
  if (!this.app.applet) methods.push('start')
  for (const method of methods) {
    await runHook(`bajo:${camelCase(`before all ${method}`)}`)
    await eachPlugins(async function () {
      const { ns } = this
      await runHook(`${ns}:${camelCase(`before ${method}`)}`)
      await me.app[ns][method]()
      await runHook(`${ns}:${camelCase(`after ${method}`)}`)
      if (method === 'start') freeze(me.app[ns].config)
    })
    await runHook(`bajo:${camelCase(`after all ${method}`)}`)
  }
  if (this.config.log.level === 'trace') {
    let text = join(map(this.app.pluginPkgs, b => camelCase(b)))
    text += ` (${this.app.pluginPkgs.length})`
    this.log.trace('loadedPlugins%s', text)
  } else this.log.debug('loadedPlugins%s', this.app.pluginPkgs.length)
}

/**
 * Attach plugins exit handlers to make sure when the app shuts down, all plugins shut down gracefully first
 *
 * @async
 */
export async function exitHandler () {
  if (!this.config.exitHandler) return

  async function exit (signal) {
    if (signal) this.log.warn('signalReceived%s', signal)
    const allNs = this.app.getAllNs().reverse()
    for (const ns of allNs) {
      try {
        await this.app[ns].exit()
      } catch (err) {}
      this.log.trace('exited%s', ns)
    }
    this.log.debug('appShutdown')
    process.exit(0)
  }

  process.on('SIGINT', async () => {
    await exit.call(this, 'SIGINT')
  })

  process.on('SIGTERM', async () => {
    await exit.call(this, 'SIGTERM')
  })

  process.on('beforeExit', async () => {
    await exit.call(this)
  })

  process.on('uncaughtException', (error, origin) => {
    setTimeout(() => {
      console.error(error)
      // process.exit(1)
    }, 50)
  })

  process.on('unhandledRejection', (reason, promise) => {
    const stackFile = reason.stack.split('\n')[1]
    let file
    const info = stackFile.match(/\((.*)\)/) // file is in (<file>)
    if (info) file = info[1]
    else if (stackFile.startsWith('    at ')) file = stackFile.slice(7) // file is stackFile itself
    if (!file) return
    const parts = file.split(':')
    const column = parseInt(parts[parts.length - 1])
    const line = parseInt(parts[parts.length - 2])
    parts.pop()
    parts.pop()
    file = parts.join(':')
    this.log.error({ file, line, column }, '%s', reason.message)
  })

  process.on('warning', warning => {
    this.log.error('%s', warning.message)
  })
}

/**
 * If app is in `applet` mode, this little helper should take care plugin's applet boot process
 *
 * @async
 * @see module:Applet
 */
export async function runAsApplet () {
  const { isString, map, find } = this.app.lib._
  await this.eachPlugins(async function ({ file }) {
    const { ns, alias } = this
    this.app.applets.push({ ns, file, alias })
  }, { glob: 'applet.js', prefix: 'bajoCli' })

  this.log.debug('appletModeActivated')
  this.print.info('appRunningAsApplet')
  if (this.app.applets.length === 0) this.print.fatal('noAppletLoaded')
  let name = this.app.applet
  if (!isString(name)) {
    const select = await this.importPkg('bajoCli:@inquirer/select')
    name = await select({
      message: this.t('Please select:'),
      choices: map(this.app.applets, t => ({ value: t.ns }))
    })
  }
  const [ns, path] = name.split(':')
  const applet = find(this.app.applets, a => (a.ns === ns || a.alias === ns))
  if (!applet) this.print.fatal('notFound%s%s', this.app.t('applet'), name)

  await this.runHook(`${applet.ns}:beforeAppletRun`, ...this.app.args)
  await this.app.bajoCli.runApplet(applet, path, ...this.app.args)
  await this.runHook(`${applet.ns}:afterAppletRun`, ...this.app.args)
}

/**
 * Import file/module from any loaded plugins.
 *
 * E.g. your plugin structure looks like this:
 * `
 * |- src
 * |  |- lib
 * |  |  |- my-module.js
 * |- index.js
 * |- package.json
 * `
 *
 * And this is how to import `my-module.js`:
 * `javascript
 * const { importModule } = this.app.bajo
 * const myModule = await importModule('myPlugin:/src/lib/my-module.js')
 * `
 *
 * @method
 * @async
 * @param {TNsPathPairs} file File to import.
 * @param {Object} [options={}] Options.
 * @param {boolean} [options.asDefaultImport=true] If `true` (default), return default imported module.
 * @param {boolean} [options.asHandler] If `true`, return as a {@link HandlerType|handler}.
 * @param {boolean} [options.noCache] If `true`, always import as a fresh copy.
 * @returns {any}
 * @see Bajo#importModule
 */
export async function importModule (file, { asDefaultImport = true, asHandler, noCache } = {}) {
  const load = async (file, asDefaultImport, noCache = false) => {
    file = resolvePath(file, true)
    if (noCache) file += `?_=${Date.now()}`
    const imported = await import(file)
    if (asDefaultImport) return imported.default
    return imported
  }

  if (this) file = this.app.getPluginFile(file)
  if (!fs.existsSync(file)) return
  let mod = await load(file, asDefaultImport, noCache)
  if (!mod) return
  if (!asHandler) return mod
  if (isFunction(mod)) mod = { level: 999, handler: mod }
  if (!isPlainObject(mod)) {
    if (this) throw this.error('fileNotModuleHandler%s', file)
    throw new Error(`File '${file}' is NOT a handler module`)
  }
  return mod
}

/**
 * Freeze object.
 *
 * @method
 * @param {Object} obj Object to freeze.
 * @param {boolean} [shallow=false] If `false` (default), deep freeze object.
 */
export function freeze (obj, options = {}) {
  const { shallow = false, clone = false } = options
  if (shallow) Object.freeze(obj)
  else deepFreeze(obj, clone)
}

// taken from https://github.com/3imed-jaberi/deepfreeze/blob/master/index.js
export function deepFreeze (object, clone = false) {
  function _deepFreeze (_object) {
    if (Object.isFrozen(_object)) return _object
    if (_object instanceof Map) {
      _object.set = _object.clear = _object.delete = function () {
        throw new Error('Map is read-only')
      }
      return _object
    }
    if (_object instanceof Set) {
      _object.add = _object.clear = _object.delete = function () {
        throw new Error('Set is read-only')
      }
      return _object
    }

    Object.freeze(_object)
    Object.getOwnPropertyNames(_object).forEach(function (key) {
      if (Object.hasOwn(_object, key) && _object[key] !== null &&
        (typeof _object[key] === 'object' || typeof _object[key] === 'function') &&
        !Object.isFrozen(_object[key])
      ) _deepFreeze(_object[key])
    })

    return _object
  }

  if (!Object.isFrozen(object)) Object.defineProperty(object, 'isDeepFrozen', { value: () => true })
  object = clone ? cloneDeep(object) : object
  return _deepFreeze(object)
}

/**
 * Find item deep in paths.
 *
 * @method
 * @param {string} item Item to find.
 * @param {Array} paths Array of path to look for.
 * @returns {string}
 */
export function findDeep (item, paths) {
  let dir
  for (const p of paths) {
    const d = `${p}/${item}`
    if (fs.existsSync(d)) {
      dir = d
      break
    }
  }
  return dir
}

/**
 * Supported data types.
 *
 * @typedef {Object} TDataType
 * @memberof Bajo
 * @type {Array}
 * @property {string} 0 string
 * @property {string} 1 float
 * @property {string} 2 double
 * @property {string} 3 integer
 * @property {string} 4 smallint
 * @property {string} 5 date
 * @property {string} 6 time
 * @property {string} 7 datetime
 * @property {string} 8 array
 * @property {string} 9 object
 * @property {string} 10 auto
 */

/**
 * General format types,
 *
 * @typedef {Object} TFormatType
 * @memberof Bajo
 * @type {Array}
 * @property {string} 0 speed
 * @property {string} 1 distance
 * @property {string} 2 area
 * @property {string} 3 degree
 */
export const types = ['speed', 'distance', 'area', 'degree']

export const formats = {
  metric: {
    speedFn: (val) => val,
    speedUnit: 'kmh',
    distanceFn: (val) => val,
    distanceUnit: 'km',
    areaFn: (val) => val,
    areaUnit: 'km²',
    degreeFn: (val) => val,
    degreeUnit: '°',
    degreeUnitSep: ''
  },
  imperial: {
    speedFn: (val) => val / 1.609,
    speedUnit: 'mih',
    distanceFn: (val) => val / 1.609,
    distanceUnit: 'mi',
    areaFn: (val) => val / 2.59,
    areaUnit: 'mi²',
    degreeFn: (val) => val,
    degreeUnit: '°',
    degreeUnitSep: ''
  },
  nautical: {
    speedFn: (val) => val / 1.852,
    speedUnit: 'knot',
    distanceFn: (val) => val / 1.852,
    distanceUnit: 'nm',
    areaFn: (val) => val / 2.92,
    areaUnit: 'nm²',
    degreeFn: (val) => val,
    degreeUnit: '°',
    degreeUnitSep: ''
  }
}
