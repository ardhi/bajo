import semver from 'semver'
import lodash from 'lodash'
import Print from '../misc/print.js'
import path from 'path'
import resolvePath from '../../lib/resolve-path.js'

const {
  isFunction,
  merge,
  forOwn,
  groupBy,
  find,
  reduce,
  map,
  trim,
  keys,
  intersection,
  each,
  camelCase,
  get
} = lodash

/**
 * @module Helper/Base
 */

/**
 * Scan plugins ```method``` directories, and turn + attach its found files as methods dynamically.
 *
 * @async
 */
export async function attachMethods () {
  const { fastGlob } = this.lib

  async function createMethod (dir) {
    dir = resolvePath(dir)
    const files = await fastGlob([`!${dir}/**/_*.{js,json}`, `${dir}/**/*.{js,json}`])
    for (const f of files) {
      const ext = path.extname(f)
      const base = f.replace(dir, '').slice(0, -ext.length)
      const name = camelCase(base)
      let mod
      if (ext === '.json') mod = this.app.bajo.readJson(f)
      else mod = await this.app.bajo.importModule(f)
      if (isFunction(mod)) mod = mod.bind(this)
      this[name] = mod
    }
    return files.length
  }

  const { eachPlugins } = this.bajo
  const me = this // the app
  me.bajo.log.debug('attachMethods')
  await eachPlugins(async function () {
    const { ns, pkgName } = this
    const dir = ns === me.mainNs ? (`${me.bajo.dir.base}/${me.mainNs}`) : me.bajo.getModuleDir(pkgName)
    const num = await createMethod.call(me[ns], `${dir}/method`, pkgName)
    me.bajo.log.trace('- %s (%d)', ns, num)
  })
}

/**
 * Build configurations
 *
 * @async
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
 */
export async function checkNameAliases () {
  const { eachPlugins } = this.bajo
  this.bajo.log.debug('checkAliasNameClash')
  const refs = []
  await eachPlugins(async function () {
    const { ns, pkgName } = this
    const { alias } = this.constructor
    let item = find(refs, { ns })
    if (item) throw this.error('pluginNameClash%s%s%s%s', ns, pkgName, item.ns, item.pkgName, { code: 'BAJO_NAME_CLASH' })
    item = find(refs, { alias })
    if (item) throw this.error('pluginNameClash%s%s%s%s', alias, pkgName, item.alias, item.pkgName, { code: 'BAJO_ALIAS_CLASH' })
    refs.push({ ns, alias, pkgName })
  })
}

/**
 * Ensure dependencies are met
 *
 * @async
 */
export async function checkDependencies () {
  async function runner () {
    const { ns, pkgName } = this
    const { join } = this.app.bajo
    this.app.bajo.log.trace('- %s', ns)
    const { dependencies } = this.app.pluginClass[this.ns]
    const odep = reduce(dependencies, (o, k) => {
      const item = map(k.split('@'), m => trim(m))
      if (k[0] === '@') o['@' + item[1]] = item[2]
      else o[item[0]] = item[1]
      return o
    }, {})
    const deps = keys(odep)
    if (deps.length > 0) {
      if (intersection(this.app.pluginPkgs, deps).length !== deps.length) {
        throw this.error('dependencyUnfulfilled%s%s', pkgName, join(deps), { code: 'BAJO_DEPENDENCY' })
      }
      each(deps, d => {
        if (!odep[d]) return
        const ver = get(this.app[camelCase(d)], 'config.pkg.version')
        if (!ver) return
        if (!semver.satisfies(ver, odep[d])) {
          throw this.error('semverCheckFailed%s%s', pkgName, `${d}@${odep[d]}`, { code: 'BAJO_DEPENDENCY_SEMVER' })
        }
      })
    }
  }

  const { eachPlugins } = this.bajo
  this.bajo.log.debug('checkDeps')
  await eachPlugins(async function () {
    await runner.call(this)
  })
}

/**
 * Collect and build hooks and push them to the bajo's hook system
 *
 * @async
 * @fires bajo:afterCollectHooks
 */
export async function collectHooks () {
  const { eachPlugins, runHook, isLogInRange, importModule, breakNsPathFromFile } = this.bajo
  const me = this
  me.bajo.hooks = this.bajo.hooks ?? []
  me.bajo.log.debug('collectHooks')
  // collects
  await eachPlugins(async function ({ dir, file }) {
    const { ns } = this
    const { fullNs, path } = breakNsPathFromFile({ file, dir, baseNs: ns, suffix: '/hook/' })
    const mod = await importModule(file, { asHandler: true })
    if (!mod) return undefined
    merge(mod, { ns: fullNs, path, src: ns })
    me.bajo.hooks.push(mod)
  }, { glob: 'hook/**/*.js', prefix: me.bajo.ns })
  // for log trace purpose only
  if (!isLogInRange('trace')) return
  const items = groupBy(me.bajo.hooks, 'ns')
  forOwn(items, (v, k) => {
    const hooks = groupBy(v, 'path')
    forOwn(hooks, (v1, k1) => {
      me.bajo.log.trace('- %s:%s (%d)', k, k1, v1.length)
    })
  })

  /**
   * Emitted after hooks are collected
   *
   * @event bajo:afterCollectHooks
   * @param {Object[]} hooks - Array of hook objects
   * @see {@tutorial hook}
   * @see module:Helper/Base.collectHooks
   */
  await runHook('bajo:afterCollectHooks', this.bajo.hooks)
}

/**
 * Finally, run all plugins
 *
 * @async
 * @fires bajo:beforeAll{method}
 * @fires {ns}:before{method}
 * @fires {ns}:after{method}
 * @fires bajo:afterAll{method}
 */
export async function run () {
  const me = this
  const { runHook, eachPlugins, join } = me.bajo
  const { freeze } = me.bajo
  const methods = ['init']
  if (!me.applet) methods.push('start')
  for (const method of methods) {
    /**
     * Emitted before all ```{method}``` executed. Accepted ```{method}```: ```Init``` or ```Start```
     *
     * @event bajo:beforeAll{method}
     * @param {string} method - Accepted methods: ```Init```, ```Start```
     * @see module:Helper/Base.run
     */
    await runHook(`bajo:${camelCase(`before all ${method}`)}`)
    await eachPlugins(async function () {
      const { ns } = this
      if (method === 'start') freeze(me[ns].config)
      /**
       * Emitted before ```{method}``` is executed within ```{ns}``` context
       *
       * - ```{ns}``` - namespace
       * - ```{method}``` - Accepted methods: ```Init``` or ```Start```
       *
       * @event {ns}:before{method}
       * @see module:Helper/Base.run
       */
      await runHook(`${ns}:${camelCase(`before ${method}`)}`)
      await me[ns][method]()
      /**
       * Emitted after ```{method}``` is executed within ```{ns}``` context
       *
       * - ```{ns}``` - namespace
       * - ```{method}``` - Accepted methods: ```Init``` or ```Start```
       *
       * @event {ns}:after{method}
       * @see module:Helper/Base.run
       */
      await runHook(`${ns}:${camelCase(`after ${method}`)}`)
    })
    /**
     * Emitted after all ```{method}``` executed. Accepted ```{method}```: ```Init``` or ```Start```
     *
     * @event bajo:afterAll{method}
     * @see module:Helper/Base.run
     */
    await runHook(`bajo:${camelCase(`after all ${method}`)}`)
  }
  me.bajo.log.debug('loadedPlugins%s', join(map(me.bajo.app.pluginPkgs, b => camelCase(b))))
}
