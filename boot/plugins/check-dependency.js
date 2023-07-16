import { reduce, map, trim, keys, intersection, each, camelCase, get } from 'lodash-es'
import semver from 'semver'

async function runner ({ name, pkgName, dependencies }) {
  const { log, getConfig, error } = this.bajo.helper
  log.trace(`Checking dependencies: %s`, name)
  const config = getConfig()
  const odep = reduce(dependencies, (o, k) => {
    const item = map(k.split('@'), m => trim(m))
    o[item[0]] = item[1]
    return o
  }, {})
  const deps = keys(odep)
  if (deps.length > 0) {
    if (intersection(config.plugins, deps).length !== deps.length)
      throw error(`Dependency for '%s' unfulfilled: %s`, pkgName, deps.join(', '), { code: 'BAJO_DEPENDENCY' })
    each(deps, d => {
      if (!odep[d]) return
      const ver = get(this[camelCase(d)], 'config.pkg.version')
      if (!ver) return
      if (!semver.satisfies(ver, odep[d]))
        throw error(`Semver check '%s' against '%s' failed`, pkgName, `${d}@${odep[d]}`, { code: 'BAJO_DEPENDENCY_SEMVER' })
    })
  }
}

async function checkDependency () {
  const { log, eachPlugins, runHook } = this.bajo.helper
  log.debug('Checking dependencies')
  await eachPlugins(async function ({ name, pkgName, dependencies }) {
    await runner.call(this, { name, pkgName, dependencies })
  })
}

export default checkDependency