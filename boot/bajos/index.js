const buildBootOrder = require('./build-boot-order')
const buildConfig = require('./build-config')
const buildArgEnv = require('./build-arg-env')

module.exports = async function () {
  const { _, fs, getConfig, error, walkBajos } = this.bajo.helper
  const config = getConfig()

  const c = buildArgEnv.call(this)
  const names = []
  const singles = []
  config.bajos = buildBootOrder.call(this)
  for (const n of config.bajos) {
    await buildConfig.call(this, n, { names, singles, c })
  }

  _.pull(config.bajos, ...singles)
  _.each(singles, s => delete this[_.camelCase(s)])

  await walkBajos(async function (n) {
    // TODO: semver
    const cfg = this[_.camelCase(n)].config
    if (cfg.dependency.length > 0 && _.intersection(config.bajos, cfg.dependency).length !== cfg.dependency.length)
      throw error(`Dependency for '${n}' unfulfilled: ${cfg.dependency.join(', ')}`, { code: 'BAJO_DEPENDENCY' })
  })
  for (const f of ['init', 'run']) {
    await walkBajos(async function (n) {
      const name = _.camelCase(n)
      const cfg = this[name].config
      const file = `${cfg.dir}/bajo/${f}.js`
      if (fs.existsSync(file)) await require(file).call(this)
    })
  }
  if (config.verbose) {
    this.bajo.log.debug(`Loaded packages: ${config.bajos.join(', ')}`)
    if (singles.length > 0) {
      this.bajo.log.warn(`Ignored single packages: ${_.map(singles, s => _.camelCase(s)).join(', ')}`)
    }
  }
}
