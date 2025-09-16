import currentLoc from '../../lib/current-loc.js'
import resolvePath from '../../lib/resolve-path.js'
import Print from '../misc/print.js'
import Log from '../misc/log.js'
import omitDeep from 'omit-deep'
import os from 'os'
import fs from 'fs-extra'
import lodash from 'lodash'
import {
  buildConfigs,
  checkDependencies,
  checkNameAliases,
  attachMethods,
  collectHooks,
  run
} from './base.js'

const {
  reduce,
  isNaN,
  forOwn,
  orderBy,
  isFunction,
  isPlainObject,
  map,
  pick,
  values,
  keys,
  set,
  get,
  filter,
  trim,
  without,
  uniq,
  camelCase,
  isEmpty
} = lodash

const omitted = ['spawn', 'cwd', 'name', 'alias', 'applet', 'a', 'plugins']

const defConfig = {
  env: 'dev',
  log: {
    timeTaken: false,
    dateFormat: 'YYYY-MM-DDTHH:MM:ss.SSS[Z]',
    localDate: false,
    pretty: false,
    applet: false,
    traceHook: false
  },
  lang: Intl.DateTimeFormat().resolvedOptions().lang ?? 'en-US',
  intl: {
    supported: ['en-US', 'id'],
    fallback: 'en-US',
    lookupOrder: [],
    format: {
      emptyValue: '',
      datetime: { dateStyle: 'medium', timeStyle: 'short' },
      date: { dateStyle: 'medium' },
      time: { timeStyle: 'short' },
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
  exitHandler: true
}

const defMain = `async function factory (pkgName) {
  const me = this

  return class Main extends this.app.pluginClass.base {
    constructor () {
      super(pkgName, me.app)
      this.config = {}
    }
  }
}

export default factory
`

/**
 * Internal helpers called by Bajo that only used once for bootstrapping. It should remains
 * hidden and not to be imported by any program.
 *
 * @module Helper/Bajo
 */

/**
 * Building bajo base config. Mostly dealing with directory setups:
 * - determine base directory
 * - check whether data directory is valid. If not exist, create one inside project dir
 * - ensure data config directory is there
 * - ensure tmp dir is there
 * - read the list of plugins from ```.plugins``` file
 *
 * @async
 */
export async function buildBaseConfig () {
  // dirs
  const { defaultsDeep } = this.app.lib.aneka
  this.config = defaultsDeep({}, this.app.envVars._, this.app.argv._)
  set(this, 'dir.base', this.app.dir)
  const path = currentLoc(import.meta).dir + '/../..'
  set(this, 'dir.pkg', this.resolvePath(path))
  if (!get(this, 'dir.data')) set(this, 'dir.data', `${this.dir.base}/data`)
  this.dir.data = this.resolvePath(this.dir.data)
  if (!fs.existsSync(this.dir.data)) {
    console.log('Data directory (%s) doesn\'t exist yet', this.dir.data)
    process.exit(1)
  }
  fs.ensureDirSync(`${this.dir.data}/config`)
  if (!this.dir.tmp) {
    this.dir.tmp = `${this.resolvePath(os.tmpdir())}/${this.ns}`
    fs.ensureDirSync(this.dir.tmp)
  }
  // collect list of plugins
  let pluginPkgs = []
  const pluginsFile = `${this.dir.data}/config/.plugins`
  if (fs.existsSync(pluginsFile)) {
    pluginPkgs = pluginPkgs.concat(filter(map(trim(fs.readFileSync(pluginsFile, 'utf8')).split('\n'), p => trim(p)), b => !isEmpty(b)))
  }
  this.app.pluginPkgs = map(filter(without(uniq(pluginPkgs), this.app.mainNs), p => {
    return p[0] !== '#'
  }), p => {
    return trim(p.split('#')[0])
  })
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
 */
export async function buildPlugins () {
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
    if (!(plugin instanceof this.app.pluginClass.base)) throw this.error('pluginPackageInvalid%s', pkg)
    this.app.addPlugin(plugin, ClassDef)
    this.log.trace('- ' + pkg)
  }
  this.log.debug('buildPluginsComplete')
}

/**
 * Collect all config handlers, including the one provided by plugins
 *
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
    this.app.configHandlers = this.app.configHandlers.concat(mod)
  }
  this.app.log = new Log(this.app)
}

/**
 * Bajo extra config:
 * - reading config file
 * - merge config with arguments & environments values
 * - Set environment (```dev``` or ```prod```)
 *
 * @async
 */
export async function buildExtConfig () {
  // config merging
  const { defaultsDeep } = this.app.lib.aneka
  let resp = await this.readAllConfigs(`${this.dir.data}/config/${this.ns}`)
  resp = omitDeep(pick(resp, ['log', 'exitHandler', 'env']), omitted)
  const envs = this.app.constructor.envs
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
  this.config = this.parseObject(pick(this.config, keys(defConfig)), { parseValue: true })
  const exts = this.app.getConfigFormats()
  if (this.app.applet) {
    if (!this.app.pluginPkgs.includes('bajo-cli')) throw this.error('appletNeedsBajoCli')
    if (!this.config.log.applet) this.config.log.level = 'silent'
    this.config.exitHandler = false
  }
  this.log.debug('configHandlers%s', this.join(exts))
}

/**
 * Setup plugins boot orders by reading plugin's ```.bootorder``` file if provided.
 *
 * @async
 */
export async function bootOrder () {
  this.log.debug('setupBootOrder')
  const order = reduce(this.app.pluginPkgs, (o, k, i) => {
    const key = map(k.split(':'), m => trim(m))
    if (key[1] && !isNaN(Number(key[1]))) o[key[0]] = Number(key[1])
    else o[key[0]] = 10000 + i
    return o
  }, {})
  const norder = {}
  for (let n of this.app.pluginPkgs) {
    n = map(n.split(':'), m => trim(m))[0]
    const dir = n === this.app.mainNs ? (`${this.dir.base}/${this.app.mainNs}`) : this.getModuleDir(n)
    if (n !== this.app.mainNs && !fs.existsSync(dir)) throw this.error('packageNotFoundOrNotBajo%s', n)
    norder[n] = NaN
    try {
      norder[n] = Number(trim(await fs.readFile(`${dir}/.bootorder`, 'utf8')))
    } catch (err) {}
  }
  const result = []
  forOwn(order, (v, k) => {
    const item = { k, v: isNaN(norder[k]) ? v : norder[k] }
    result.push(item)
  })
  this.app.pluginPkgs = map(orderBy(result, ['v']), 'k')
  this.log.debug('runInEnv%s', this.t(this.app.constructor.envs[this.config.env]))
  // misc
  this.freeze(this.config)
}

/**
 * Iterate through all plugins loaded and do:
 *
 * 1. {@link module:Helper/Base.buildConfigs|build configs}
 * 2. {@link module:Helper/Base.checkNameAliases|ensure names & aliases uniqueness}
 * 3. {@link module:Helper/Base.checkDependencies|ensure dependencies are met}
 * 4. {@link module:Helper/Base.attachMethods|build and attach dynamic methods}
 * 5. {@link module:Helper/Base.collectHooks|collect hooks}
 * 6. {@link module:Helper/Base.run|run plugins}
 *
 * @async
 */
export async function bootPlugins () {
  await buildConfigs.call(this.app)
  await checkNameAliases.call(this.app)
  await checkDependencies.call(this.app)
  await attachMethods.call(this.app)
  await collectHooks.call(this.app)
  await run.call(this.app)
}

/**
 * Attach plugins exit handlers and make sure the app shutdowns gracefully
 *
 * @async
 */
export async function exitHandler () {
  if (!this.config.exitHandler) return

  async function exit (signal) {
    const { eachPlugins } = this
    if (signal) this.log.warn('signalReceived%s', signal)
    await eachPlugins(async function ({ ns }) {
      try {
        await this.exit()
      } catch (err) {}
      this.log.trace('exited')
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
 */
export async function runAsApplet () {
  const { isString, map, find } = this.app.lib._
  await this.eachPlugins(async function ({ file }) {
    const { ns } = this
    const { alias } = this.constructor
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
  await this.runHook(`${this.app[applet.ns]}:beforeAppletRun`, ...this.app.args)
  await this.app.bajoCli.runApplet(applet, path, ...this.app.args)
  /**
   * Run after applet is run. ```[ns]``` is applet's namespace
   *
   * @global
   * @event {ns}:afterAppletRun
   * @param {...any} params
   * @see {@tutorial hook}
   * @see module:Helper/Bajo.runAsApplet
   */
  await this.runHook(`${this.app[applet.ns]}:afterAppletRun`, ...this.app.args)
}
