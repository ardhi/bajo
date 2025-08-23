import readAllConfigs from '../../lib/read-all-configs.js'
import currentLoc from '../../lib/current-loc.js'
import resolvePath from '../../lib/resolve-path.js'
import omitDeep from 'omit-deep'
import os from 'os'
import fs from 'fs-extra'
import lodash from 'lodash'
import {
  buildConfig,
  checkDependency,
  checkAlias,
  attachMethod,
  collectHooks,
  run
} from './bajo-plugin.js'

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
  isString,
  filter,
  trim,
  without,
  uniq,
  camelCase,
  isEmpty,
  omit
} = lodash

const omitted = ['spawn', 'cwd', 'name', 'alias', 'applet', 'a', 'plugins']

const defConfig = {
  log: {
    dateFormat: 'YYYY-MM-DDTHH:MM:ss.SSS[Z]',
    plain: false,
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

/**
 * @module
 */

/**
 * Building bajo core base config. Mostly dealing with directory setups:
 * - determine base directory
 * - check whether data directory is valid
 * - ensure data config directory is there
 *
 * @async
 */
export async function buildBaseConfig () {
  const { defaultsDeep } = this.lib.aneka
  this.applet = this.app.argv._.applet
  this.config = defaultsDeep({}, this.app.env._, this.app.argv._)
  this.alias = this.name
  set(this, 'dir.base', this.app.dir)
  const path = currentLoc(import.meta).dir + '/../../..'
  set(this, 'dir.pkg', this.resolvePath(path))
  if (!get(this, 'dir.data')) set(this, 'dir.data', `${this.dir.base}/data`)
  this.dir.data = this.resolvePath(this.dir.data)
  if (!fs.existsSync(this.dir.data)) {
    console.log('Data directory (%s) doesn\'t exist yet', this.dir.data)
    process.exit(1)
  }
  fs.ensureDirSync(`${this.dir.data}/config`)
  if (!this.dir.tmp) {
    this.dir.tmp = `${this.resolvePath(os.tmpdir())}/${this.name}`
    fs.ensureDirSync(this.dir.tmp)
  }
  this.app.addPlugin(this)
}

/**
 * Building all plugins:
 * - read the list of plugins from ```.plugins``` file
 * - iterate through the list and build related plugins
 * - attach these plugins to the app instance
 *
 * @async
 */
export async function buildPlugins () {
  let pluginPkgs = this.config.plugins ?? []
  if (isString(pluginPkgs)) pluginPkgs = [pluginPkgs]
  const pluginsFile = `${this.dir.data}/config/.plugins`
  if (fs.existsSync(pluginsFile)) {
    pluginPkgs = pluginPkgs.concat(filter(map(trim(fs.readFileSync(pluginsFile, 'utf8')).split('\n'), p => trim(p)), b => !isEmpty(b)))
  }
  this.pluginPkgs = map(filter(without(uniq(pluginPkgs), this.mainNs), p => {
    return p[0] !== '#'
  }), p => {
    return trim(p.split('#')[0])
  })
  this.pluginPkgs.push(this.mainNs)
  for (const pkg of this.pluginPkgs) {
    const ns = camelCase(pkg)
    let dir
    if (ns === 'main') {
      dir = `${this.dir.base}/${this.mainNs}`
      fs.ensureDirSync(dir)
      fs.ensureDirSync(`${dir}/plugin`)
    } else dir = this.getModuleDir(pkg)
    let plugin
    const factory = `${dir}/index.js`
    if (fs.existsSync(factory)) {
      const { default: builder } = await import(resolvePath(factory, true))
      const FactoryClass = await builder.call(this, pkg)
      plugin = new FactoryClass()
      if (!(plugin instanceof this.lib.BajoPlugin)) throw new Error(`Plugin package '${pkg}' should be an instance of BajoPlugin`)
    } else {
      plugin = new this.lib.BajoPlugin(pkg, this.app)
    }
    this.pluginNames.push(plugin.name)
    this.app.addPlugin(plugin)
  }
  this.config = omit(this.config, this.pluginNames)
}

export async function collectConfigHandlers () {
  for (const pkg of this.pluginPkgs) {
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
    this.configHandlers = this.configHandlers.concat(mod)
  }
}

/**
 * Bajo core extra config:
 * - reading core config file
 * - merge config with arguments & environments values
 * - Set environment (```dev``` or ```prod```)
 *
 * @async
 */
export async function buildExtConfig () {
  // config merging
  const { defaultsDeep } = this.lib.aneka
  let resp = await readAllConfigs.call(this.app, `${this.dir.data}/config/${this.name}`)
  resp = omitDeep(pick(resp, ['log', 'exitHandler', 'env']), omitted)
  this.config = defaultsDeep({}, this.config, resp, defConfig)
  this.config.env = (this.config.env ?? 'dev').toLowerCase()
  if (values(this.envs).includes(this.config.env)) this.config.env = this.lib.aneka.getKeyByValue(this.envs, this.config.env)
  if (!keys(this.envs).includes(this.config.env)) throw new Error(`Unknown environment '${this.config.env}'. Supported: ${this.join(keys(this.envs))}`)
  process.env.NODE_ENV = this.envs[this.config.env]
  if (!this.config.log.level) this.config.log.level = this.config.env === 'dev' ? 'debug' : 'info'
  if (this.config.silent) this.config.log.level = 'silent'
  if (this.applet) {
    if (!this.pluginPkgs.includes('bajo-cli')) throw new Error('Applet needs to have \'bajo-cli\' loaded first')
    if (!this.config.log.applet) this.config.log.level = 'silent'
    this.config.exitHandler = false
  }
  const exts = map(this.configHandlers, 'ext')
  this.initPrint()
  this.initLog()
  this.log.debug('configHandlers%s', this.join(exts))
  this.config = this.parseObject(this.config, { parseValue: true })
}

export async function bootOrder () {
  this.log.debug('setupBootOrder')
  const order = reduce(this.pluginPkgs, (o, k, i) => {
    const key = map(k.split(':'), m => trim(m))
    if (key[1] && !isNaN(Number(key[1]))) o[key[0]] = Number(key[1])
    else o[key[0]] = 10000 + i
    return o
  }, {})
  const norder = {}
  for (let n of this.pluginPkgs) {
    n = map(n.split(':'), m => trim(m))[0]
    const dir = n === this.mainNs ? (`${this.dir.base}/${this.mainNs}`) : this.getModuleDir(n)
    if (n !== this.mainNs && !fs.existsSync(dir)) throw this.error('packageNotFoundOrNotBajo%s', n)
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
  this.pluginPkgs = map(orderBy(result, ['v']), 'k')
  this.log.info('runInEnv%s', this.print.write(this.envs[this.config.env]))
  // misc
  this.freeze(this.config)
}

/**
 * Iterate through all plugins loaded and do:
 * 1. {@link module:class/helper/bajo-plugin.buildConfigs|build configs}
 * 2. {@link module:class/helper/bajo-plugin.checkNameAliases|ensure names & aliases uniqueness}
 * 3. {@link module:class/helper/bajo-plugin.checkDependencies|ensure dependencies are met}
 * 4. {@link module:class/helper/bajo-plugin.attachMethods|build and attach dynamic methods}
 * 5. {@link module:class/helper/bajo-plugin.collectHooks|collect hooks}
 * 6. {@link module:class/helper/bajo-plugin.run|run plugins}
 *
 * @async
 */
export async function bootPlugins () {
  await buildConfig.call(this.app)
  await checkAlias.call(this.app)
  await checkDependency.call(this.app)
  await attachMethod.call(this.app)
  await collectHooks.call(this.app)
  await run.call(this.app)
}

async function exit (signal) {
  const { eachPlugins } = this
  this.log.warn('signalReceived%s', signal)
  await eachPlugins(async function () {
    try {
      await this.stop()
    } catch (err) {}
    this.log.trace('exited')
  })
  this.log.debug('appShutdown')
  process.exit(0)
}

export async function exitHandler () {
  if (!this.config.exitHandler) return

  process.on('SIGINT', async () => {
    await exit.call(this, 'SIGINT')
  })

  process.on('SIGTERM', async () => {
    await exit.call(this, 'SIGTERM')
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

export async function runAsApplet () {
  const { isString, map, find } = this.lib._
  await this.eachPlugins(async function ({ file }) {
    const { name: ns, alias } = this
    this.app.bajo.applets.push({ ns, file, alias })
  }, { glob: 'applet.js', prefix: 'bajoCli' })

  this.log.debug('appletModeActivated')
  this.print.info('appRunningAsApplet')
  if (this.applets.length === 0) this.print.fatal('noAppletLoaded')
  let name = this.applet
  if (!isString(this.applet)) {
    const select = await this.importPkg('bajoCli:@inquirer/select')
    name = await select({
      message: this.print.write('Please select:'),
      choices: map(this.applets, t => ({ value: t.ns }))
    })
  }
  const [ns, path] = name.split(':')
  const applet = find(this.applets, a => (a.ns === ns || a.alias === ns))
  if (!applet) this.print.fatal('notFound%s%s', this.print.write('applet'), name)
  await this.runHook(`${this.app[applet.ns]}:beforeAppletRun`)
  await this.app.bajoCli.runApplet(applet, path, ...this.app.args)
  await this.runHook(`${this.app[applet.ns]}:afterAppletRun`)
}
