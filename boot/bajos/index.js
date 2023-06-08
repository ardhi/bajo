const buildConfig = require('./build-config')
const buildArgEnv = require('./build-arg-env')
const checkDependency = require('./check-dependency')

module.exports = async function () {
  const { _, fs, getConfig, walkBajos, freeze } = this.bajo.helper
  const config = getConfig()

  const c = buildArgEnv.call(this)
  const names = []
  const singles = []
  for (const pkg of config.bajos) {
    await buildConfig.call(this, pkg, { names, singles, c })
  }
  _.pull(config.bajos, ...singles)
  _.each(singles, s => delete this[_.camelCase(s)])
  freeze(this.bajo.config)
  await walkBajos(async function ({ name, pkg }) {
    await checkDependency.call(this, name, pkg)
  })
  const methods = { init: 'Initialization', start: 'Start Services' }
  for (const f of _.keys(methods)) {
    await walkBajos(async function ({ name, cfg }) {
      const file = `${cfg.dir}/bajo/${f}.js`
      if (fs.existsSync(file)) {
        await require(file).call(this)
        this.bajo.event.emit('boot', [`${name}${_.upperFirst(f)}`, `%s: %s`, 'debug', methods[f], name])
      }
      if (f === 'init') freeze(cfg)
    })
  }
  if (config.verbose) {
    this.bajo.log.debug(`Loaded packages: ${config.bajos.join(', ')}`)
    if (singles.length > 0) {
      this.bajo.log.warn(`Ignored single packages: ${_.map(singles, s => _.camelCase(s)).join(', ')}`)
    }
  }
}
