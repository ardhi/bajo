async function runner (name, pkg) {
  const { _, log, getConfig, error, semver } = this.bajo.helper
  log.trace(`Checking dependency: %s`, name)
  const config = getConfig()
  const cfg = this[name].config
  const odep = _.reduce(cfg.dependency, (o, k) => {
    const item = _.map(k.split('@'), m => _.trim(m))
    o[item[0]] = item[1]
    return o
  }, {})
  const deps = _.keys(odep)
  if (deps.length > 0) {
    if (_.intersection(config.bajos, deps).length !== deps.length)
      throw error(`Dependency for '${pkg}' unfulfilled: ${deps.join(', ')}`, { code: 'BAJO_DEPENDENCY' })
    _.each(deps, d => {
      if (!odep[d]) return
      const ver = _.get(this[_.camelCase(d)], 'config.pkg.version')
      if (!ver) return
      if (!semver.satisfies(ver, odep[d]))
        throw error(`Semver check '${pkg}' against '${d}@${odep[d]}' failed`, { code: 'BAJO_DEPENDENCY_SEMVER' })
    })
  }
}

async function checkDependency () {
  const { log, walkBajos, setHook } = this.bajo.helper
  log.debug('Checking dependencies')
  await walkBajos(async function ({ name, pkg }) {
    await runner.call(this, name, pkg)
  })
  await setHook('bajo:afterCheckDeps')
}

export default checkDependency