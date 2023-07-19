import { reduce, map, trim, keys, intersection, each, camelCase, get } from 'lodash-es'
import semver from 'semver'

async function runner ({ plugin, pkg, dependencies }) {
  const { log, getConfig, error } = this.bajo.helper
  log.trace('Checking dependencies: %s', plugin)
  const config = getConfig()
  const odep = reduce(dependencies, (o, k) => {
    const item = map(k.split('@'), m => trim(m))
    o[item[0]] = item[1]
    return o
  }, {})
  const deps = keys(odep)
  if (deps.length > 0) {
    if (intersection(config.plugins, deps).length !== deps.length) {
      throw error('Dependency for \'%s\' unfulfilled: %s', pkg, deps.join(', '), { code: 'BAJO_DEPENDENCY' })
    }
    each(deps, d => {
      if (!odep[d]) return
      const ver = get(this[camelCase(d)], 'config.pkg.version')
      if (!ver) return
      if (!semver.satisfies(ver, odep[d])) {
        throw error('Semver check \'%s\' against \'%s\' failed', pkg, `${d}@${odep[d]}`, { code: 'BAJO_DEPENDENCY_SEMVER' })
      }
    })
  }
}

async function checkDependency () {
  const { log, eachPlugins } = this.bajo.helper
  log.debug('Checking dependencies')
  await eachPlugins(async function ({ plugin, pkg, dependencies }) {
    await runner.call(this, { plugin, pkg, dependencies })
  })
}

export default checkDependency
