import Print from './print.js'
import Log from './log.js'
import os from 'os'
import fs from 'fs-extra'
import lodash from 'lodash'
import semver from 'semver'
import aneka from 'aneka/index.js'
import outmatch from 'outmatch'
import fastGlob from 'fast-glob'
import { sprintf } from 'sprintf-js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import weekOfYear from 'dayjs/plugin/weekOfYear.js'
import freeze from '../lib/freeze.js'
import findDeep from '../lib/find-deep.js'
import omitDeep from 'omit-deep'

/**
 * Internal helpers called by Bajo and other classes. It should remains
 * hidden and not to be imported by any program.
 *
 * @module Helper
 */

const {
  merge, forOwn, groupBy, find, reduce, map, trim, keys, intersection, each,
  camelCase, get, orderBy, isFunction, isPlainObject, pick, values, set, without, uniq, isEmpty
} = lodash

const omitted = ['spawn', 'cwd', 'name', 'alias', 'applet', 'a', 'plugins']

const defConfig = {
  env: 'dev',
  runtime: {
    noWarning: false
  },
  log: {
    timeTaken: false,
    dateFormat: 'YYYY-MM-DDTHH:mm:ss.SSS',
    useUtc: false,
    pretty: false,
    applet: false,
    traceHook: false,
    save: false,
    rotation: {
      cycle: 'none', // none, daily, weekly, monthly
      compressOld: true,
      byPlugin: false,
      retain: 5
    }
  },
  dump: {
    depth: 2,
    compact: false,
    colors: true,
    breakLength: 80,
    caller: true,
    frame: {
      titleAllignment: 'center',
      padding: 1,
      margin: 1,
      borderStyle: 'round'
    }
  },
  lang: Intl.DateTimeFormat().resolvedOptions().lang ?? 'en-US',
  intl: {
    supported: ['en-US', 'id'],
    fallback: 'en-US',
    lookupOrder: [],
    format: {
      emptyValue: '',
      datetime: { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' },
      date: { dateStyle: 'medium', timeZone: 'UTC' },
      time: { timeStyle: 'short', timeZone: 'UTC' },
      float: { maximumFractionDigits: 2 },
      double: { maximumFractionDigits: 5 },
      smallint: {},
      integer: {}
    },
    unitSys: {
      'en-US': 'imperial',
      id: 'metric'
    }
  },
  exitHandler: true,
  cache: {
    purge: [],
    purgeIntvDur: '5m'
  }
}

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
 * @typedef {Object} TAppLib
 * @property {Object} _ Access to {@link https://lodash.com|lodash}.
 * @property {Object} fs Access to {@link https://github.com/jprichardson/node-fs-extra|fs-extra}.
 * @property {Object} fastGlob Access to {@link https://github.com/mrmlnc/fast-glob|fast-glob}.
 * @property {Object} sprintf Access to {@link https://github.com/alexei/sprintf.js|sprintf}.
 * @property {Object} aneka Access to {@link https://github.com/ardhi/aneka|aneka}.
 * @property {Object} outmatch Access to {@link https://github.com/axtgr/outmatch|outmatch}.
 * @property {Object} dayjs Access to {@link https://day.js.org|dayjs} with utc & customParseFormat plugin already applied.
 * @property {Object} freeze
 * @property {Object} findDeep
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
  omitDeep
}

/**
 * Building bajo base config. Mostly dealing with directory setups:
 * - determine base directory
 * - check whether data directory is valid. If not exist, create one inside app dir
 * - ensure data config directory is there
 * - ensure tmp dir is there
 * - read the list of plugins from ```.plugins``` file
 *
 * @async
 * @method
 * @memberof module:Helper
 */
export async function buildBaseConfig () {
  // dirs
  const { defaultsDeep, textToArray, currentLoc, resolvePath } = this.app.lib.aneka
  this.config = defaultsDeep({}, this.app.argv._, this.app.envVars._)
  set(this, 'dir.base', this.app.dir)
  const path = currentLoc(import.meta).dir + '/..'
  set(this, 'dir.pkg', resolvePath(path))
  if (get(this, 'config.dir.data')) set(this, 'dir.data', this.config.dir.data)
  if (!get(this, 'dir.data')) set(this, 'dir.data', `${this.dir.base}/data`)
  this.dir.data = resolvePath(this.dir.data)
  fs.ensureDirSync(`${this.dir.data}/config`)
  if (!this.dir.tmp) {
    this.dir.tmp = `${resolvePath(os.tmpdir())}/${this.ns}`
    fs.ensureDirSync(this.dir.tmp)
  }
  this.pkg = await this.getPkgInfo()
  let pluginPkgs = this.app.pluginPkgs
  if (isEmpty(pluginPkgs)) {
    // collect list of plugins
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
 * Building all plugins:
 * - load from app's pluginPkgs
 * - iterate through the list and build related plugins
 * - making sure main plugin is there. If not, create from template
 * - attach these plugins to the app instance
 *
 * @async
 * @memberof module:Helper
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
  this.log.debug('buildPluginsComplete')
}

/**
 * Collect all config handlers, including the one provided by plugins
 *
 * @async
 * @memberof module:Helper
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
 * Bajo extra config:
 * - reading config file
 * - merge config with arguments & environments values
 * - Set environment (```dev``` or ```prod```)
 *
 * @async
 * @memberof module:Helper
 */
export async function buildExtConfig () {
  // config merging
  const { defaultsDeep, includes } = this.app.lib.aneka
  const { parseObject, omitDeep } = this.app.lib
  const { isEmpty, get, isString, without } = this.app.lib._

  let resp = get(this, `app.options.config.${this.ns}`, {})
  if (isEmpty(resp)) resp = await this.readAllConfigs(`${this.dir.data}/config/${this.ns}`)
  resp = omitDeep(pick(resp, ['log', 'exitHandler', 'env', 'runtime']), omitted)
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
 * Setup plugins boot orders by reading plugin's ```.bootorder``` file if provided.
 *
 * @async
 * @memberof module:Helper
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
 * Build configurations
 *
 * @async
 * @memberof module:Helper
 */
export async function buildConfigs () {
  this.bajo.log.debug('readConfigs')
  for (const ns of this.getAllNs()) {
    await this[ns].loadConfig()
    this[ns].print = new Print(this[ns])
    this.loadIntl(ns)
  }
}

/**
 * Ensure for names and aliases to be unique and no clashes with other plugins
 *
 * @async
 * @memberof module:Helper
 */
export async function checkNameAliases () {
  this.bajo.log.debug('checkAliasNameClash')
  const refs = []
  for (const pkg of this.bajo.app.pluginPkgs) {
    const plugin = this.bajo.app[camelCase(pkg)]
    const { ns, alias } = plugin
    let item = find(refs, { ns })
    if (item) throw this.bajo.error('pluginNameClash%s%s%s%s', ns, pkg, item.ns, item.pkg, { code: 'BAJO_NAME_CLASH' })
    item = find(refs, { alias })
    if (item) throw this.bajo.error('pluginNameClash%s%s%s%s', alias, pkg, item.alias, item.pkg, { code: 'BAJO_ALIAS_CLASH' })
    refs.push({ ns, alias, pkg })
  }
}

/**
 * Ensure dependencies are met
 *
 * @async
 * @memberof module:Helper
 */
export async function checkDependencies () {
  const { join } = this.bajo
  this.bajo.log.debug('checkDeps')
  for (const pkg of this.bajo.app.pluginPkgs) {
    const plugin = this.bajo.app[camelCase(pkg)]
    const { ns, dependencies } = plugin
    this.bajo.log.trace('- %s', ns)
    const odep = reduce(dependencies, (o, k) => {
      const item = map(k.split('@'), m => trim(m))
      if (k[0] === '@') o['@' + item[1]] = item[2]
      else o[item[0]] = item[1]
      return o
    }, {})
    const deps = keys(odep)
    if (deps.length > 0) {
      if (intersection(this.bajo.app.pluginPkgs, deps).length !== deps.length) {
        throw this.bajo.error('dependencyUnfulfilled%s%s', pkg, join(deps), { code: 'BAJO_DEPENDENCY' })
      }
      each(deps, d => {
        if (!odep[d]) return
        const ver = get(this.bajo.app[camelCase(d)], 'pkg.version')
        if (!ver) return
        if (!semver.satisfies(ver, odep[d])) {
          throw this.bajo.error('semverCheckFailed%s%s', pkg, `${d}@${odep[d]}`, { code: 'BAJO_DEPENDENCY_SEMVER' })
        }
      })
    }
  }
}

/**
 * Collect and build hooks and push them to the bajo's hook system
 *
 * @async
 * @memberof module:Helper
 * @fires bajo:afterCollectHooks
 */
export async function collectHooks () {
  const { eachPlugins, runHook, isLogInRange, importModule } = this.bajo
  const { isArray, isPlainObject } = this.lib._
  const me = this // "this" is "app"
  me.bajo.log.trace('collecting%s', this.t('hooks'))
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
            me.bajo.hooks.push(merge({}, m, { name, src: this.ns }))
          }
        } else {
          m.src = this.ns
          me.bajo.hooks.push(m)
        }
      }
    } else {
      const _file = file.replace(dir + '/hook/', '').replace('.js', '')
      let [names, path] = _file.split('@')
      names = names.split('$').map(n => trim(n))
      for (let name of names) {
        name = name.split('.').map(n => camelCase(n)).join('.')
        const m = merge({}, mod, { name: `${name}:${camelCase(path)}`, src: this.ns })
        me.bajo.hooks.push(m)
      }
    }
  }, { glob: ['hook/*.js', 'hook.js'], prefix: me.bajo.ns })
  // for log trace purpose only
  if (isLogInRange('trace')) {
    const items = groupBy(me.bajo.hooks, item => item.name)
    forOwn(items, (v, k) => {
      const [name, path] = k.split(':')
      me.bajo.log.trace('- %s:%s (%d)', name, path, v.length)
    })
  }

  /**
   * Run after hooks are collected
   *
   * @global
   * @event bajo:afterCollectHooks
   * @param {Object[]} hooks - Array of hook objects
   * @see {@tutorial hook}
   * @see module:Helper/Base.collectHooks
   */
  await runHook('bajo:afterCollectHooks', this.bajo.hooks)
  me.bajo.log.debug('collected%s%d', this.t('hooks'), me.bajo.hooks.length)
}

/**
 * Finally, run all plugins
 *
 * @async
 * @fires bajo:beforeAll{method}
 * @fires {ns}:before{method}
 * @fires {ns}:after{method}
 * @fires bajo:afterAll{method}
 * @memberof module:Helper
 */
export async function run () {
  const me = this
  const { runHook, eachPlugins, join } = me.bajo
  const { freeze } = me.lib
  const methods = ['init']
  if (!me.applet) methods.push('start')
  for (const method of methods) {
    /**
     * Run before all ```{method}``` executed. Accepted ```{method}```: ```Init``` or ```Start```
     *
     * @global
     * @event bajo:beforeAll{method}
     * @param {string} method - Accepted methods: ```Init```, ```Start```
     * @see module:Helper/Base.run
     */
    await runHook(`bajo:${camelCase(`before all ${method}`)}`)
    await eachPlugins(async function () {
      const { ns } = this
      /**
       * Run before ```{method}``` is executed within ```{ns}``` context
       *
       * - ```{ns}``` - namespace
       * - ```{method}``` - Accepted methods: ```Init``` or ```Start```
       *
       * @global
       * @event {ns}:before{method}
       * @see module:Helper/Base.run
       */
      await runHook(`${ns}:${camelCase(`before ${method}`)}`)
      await me[ns][method]()
      /**
       * Run after ```{method}``` is executed within ```{ns}``` context
       *
       * - ```{ns}``` - namespace
       * - ```{method}``` - Accepted methods: ```Init``` or ```Start```
       *
       * @global
       * @event {ns}:after{method}
       * @see module:Helper/Base.run
       */
      await runHook(`${ns}:${camelCase(`after ${method}`)}`)
      if (method === 'start') freeze(me[ns].config)
    })
    /**
     * Run after all ```{method}``` executed. Accepted ```{method}```: ```Init``` or ```Start```
     *
     * @global
     * @event bajo:afterAll{method}
     * @see module:Helper/Base.run
     */
    await runHook(`bajo:${camelCase(`after all ${method}`)}`)
  }
  if (me.bajo.config.log.level === 'trace') {
    let text = join(map(me.bajo.app.pluginPkgs, b => camelCase(b)))
    text += ` (${me.bajo.app.pluginPkgs.length})`
    me.bajo.log.trace('loadedPlugins%s', text)
  } else me.bajo.log.debug('loadedPlugins%s', me.bajo.app.pluginPkgs.length)
}

/**
 * Iterate through all plugins loaded and do:
 *
 * 1. {@link module:Helper/Base.buildConfigs|build configs}
 * 2. {@link module:Helper/Base.checkNameAliases|ensure names & aliases uniqueness}
 * 3. {@link module:Helper/Base.checkDependencies|ensure dependencies are met}
 * 4. {@link module:Helper/Base.collectHooks|collect hooks}
 * 5. {@link module:Helper/Base.run|run plugins}
 *
 * @async
 * @memberof module:Helper
 */
export async function bootPlugins () {
  await buildConfigs.call(this.app)
  await checkNameAliases.call(this.app)
  await checkDependencies.call(this.app)
  await collectHooks.call(this.app)
  await run.call(this.app)
}

/**
 * Attach plugins exit handlers and make sure the app shutdowns gracefully
 *
 * @async
 * @memberof module:Helper
 */
export async function exitHandler () {
  if (!this.config.exitHandler) return

  async function exit (signal) {
    const { eachPlugins } = this
    if (signal) this.log.warn('signalReceived%s', signal)
    const me = this
    await eachPlugins(async function ({ ns }) {
      try {
        await this.exit()
      } catch (err) {}
      me.log.trace('exited%s', this.ns)
    })
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
 * If app is in ```applet``` mode, this little helper should take care plugin's applet boot process
 *
 * @async
 * @fires {ns}:beforeAppletRun
 * @fires {ns}:afterAppletRun
 * @memberof module:Helper
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

  /**
   * Run before applet is run. ```[ns]``` is applet's namespace
   *
   * @global
   * @event {ns}:beforeAppletRun
   * @param {...any} params
   * @see {@tutorial hook}
   * @see module:Helper/Bajo.runAsApplet
   */
  await this.runHook(`${applet.ns}:beforeAppletRun`, ...this.app.args)
  await this.app.bajoCli.runApplet(applet, path, ...this.app.args)
  /**
   * Run after applet is run. ```[ns]``` is applet's namespace
   *
   * @global
   * @event {ns}:afterAppletRun
   * @param {...any} params
   * @see {@tutorial hook}
   * @see module:Helper/Bajo.runAsApplet
   * @memberof module:Helper
   */
  await this.runHook(`${applet.ns}:afterAppletRun`, ...this.app.args)
}
