import { reduce, map, trim, keys, intersection, each, camelCase, get } from 'lodash-es'
import semver from 'semver'

async function runner ({ ns, pkgName, dependencies }) {
  const { error, join } = this.app.bajo
  this.app.bajo.log.trace('Checking dependencies: %s', ns)
  const odep = reduce(dependencies, (o, k) => {
    const item = map(k.split('@'), m => trim(m))
    o[item[0]] = item[1]
    return o
  }, {})
  const deps = keys(odep)
  if (deps.length > 0) {
    if (intersection(this.app.bajo.config.plugins, deps).length !== deps.length) {
      throw error('Dependency for \'%s\' unfulfilled: %s', pkgName, join(deps), { code: 'BAJO_DEPENDENCY' })
    }
    each(deps, d => {
      if (!odep[d]) return
      const ver = get(this.app[camelCase(d)], 'config.pkg.version')
      if (!ver) return
      if (!semver.satisfies(ver, odep[d])) {
        throw error('Semver check \'%s\' against \'%s\' failed', pkgName, `${d}@${odep[d]}`, { code: 'BAJO_DEPENDENCY_SEMVER' })
      }
    })
  }
}

async function checkDependency () {
  const { eachPlugins } = this.bajo
  this.bajo.log.debug('Checking dependencies')
  await eachPlugins(async function ({ ns, pkgName, dependencies }) {
    await runner.call(this, { ns, pkgName, dependencies })
  })
}

export default checkDependency
