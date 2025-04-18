import lodash from 'lodash'
import semver from 'semver'

const { reduce, map, trim, keys, intersection, each, camelCase, get } = lodash

async function runner ({ ns, pkgName }) {
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

async function checkDependency () {
  const { eachPlugins } = this.bajo
  this.bajo.log.debug('checkDeps')
  await eachPlugins(async function ({ ns, pkgName, config }) {
    await runner.call(this, { ns, pkgName, config })
  })
}

export default checkDependency
