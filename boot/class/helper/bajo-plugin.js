import createMethod from '../../lib/create-method.js'
import semver from 'semver'
import lodash from 'lodash'

const {
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
 * @module
 */

/**
 * Scan plugins ```method``` directories, and turn + attach its found files as methods dynamically.
 *
 * @async
 */
export async function attachMethods () {
  const { eachPlugins } = this.bajo
  const me = this // the app
  me.bajo.log.debug('attachMethods')
  await eachPlugins(async function () {
    const { name: ns, pkgName } = this
    const dir = ns === me.bajo.mainNs ? (`${me.bajo.dir.base}/${me.bajo.mainNs}`) : me.bajo.getModuleDir(pkgName)
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
  for (const pkg of this.bajo.pluginPkgs) {
    const plugin = this[camelCase(pkg)]
    await plugin.loadConfig()
    plugin.initPrint()
    plugin.initLog()
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
    const { name: ns, pkgName, alias } = this
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
    const { name: ns, pkgName } = this
    const { join } = this.app.bajo
    this.app.bajo.log.trace('- %s', ns)
    const odep = reduce(this.dependencies, (o, k) => {
      const item = map(k.split('@'), m => trim(m))
      if (k[0] === '@') o['@' + item[1]] = item[2]
      else o[item[0]] = item[1]
      return o
    }, {})
    const deps = keys(odep)
    if (deps.length > 0) {
      if (intersection(this.app.bajo.pluginPkgs, deps).length !== deps.length) {
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
 */
export async function collectHooks () {
  const { eachPlugins, runHook, isLogInRange, importModule, breakNsPathFromFile } = this.bajo
  const me = this
  me.bajo.hooks = this.bajo.hooks ?? []
  me.bajo.log.debug('collectHooks')
  // collects
  await eachPlugins(async function ({ dir, file }) {
    const { name: ns } = this
    const { fullNs, path } = breakNsPathFromFile({ file, dir, baseNs: ns, suffix: '/hook/' })
    const mod = await importModule(file, { asHandler: true })
    if (!mod) return undefined
    merge(mod, { ns: fullNs, path, src: ns })
    me.bajo.hooks.push(mod)
  }, { glob: 'hook/**/*.js', prefix: me.bajo.name })
  // for log trace purpose only
  if (!isLogInRange('trace')) return
  const items = groupBy(me.bajo.hooks, 'ns')
  forOwn(items, (v, k) => {
    const hooks = groupBy(v, 'path')
    forOwn(hooks, (v1, k1) => {
      me.bajo.log.trace('- %s:%s (%d)', k, k1, v1.length)
    })
  })
  // run handler
  await runHook('bajo:afterCollectHooks')
}

/**
 * Finally, run all plugins
 *
 * @async
 */
export async function run () {
  const me = this
  const { runHook, eachPlugins, join } = me.bajo
  const { freeze } = me.bajo
  const methods = ['init']
  if (!me.bajo.applet) methods.push('start')
  for (const method of methods) {
    await runHook(`bajo:${camelCase(`before ${method} all plugins`)}`)
    await eachPlugins(async function () {
      const { name: ns } = this
      if (method === 'start') freeze(me[ns].config)
      await runHook(`${ns}:${camelCase(`before ${method}`)}`)
      await me[ns][method]()
      await runHook(`${ns}:${camelCase(`after ${method}`)}`)
    })
    await runHook(`bajo:${camelCase(`after ${method} all plugins`)}`)
  }
  me.bajo.log.debug('loadedPlugins%s', join(map(me.bajo.pluginPkgs, b => camelCase(b))))
}
