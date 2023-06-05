const buildConfig = require('./build-config')
const buildArgEnv = require('./build-arg-env')
const checkDependency = require('./check-dependency')

module.exports = async function () {
  const { _, fs, getConfig, error, walkBajos } = this.bajo.helper
  const config = getConfig()

  const c = buildArgEnv.call(this)
  const names = []
  const singles = []
  for (const n of config.bajos) {
    await buildConfig.call(this, n, { names, singles, c })
  }
  _.pull(config.bajos, ...singles)
  _.each(singles, s => delete this[_.camelCase(s)])
  await walkBajos(async function (n) {
    await checkDependency.call(this, n)
  })
  for (const f of ['init', 'run']) {
    await walkBajos(async function (n) {
      const name = _.camelCase(n)
      const cfg = this[name].config
      const file = `${cfg.dir}/bajo/${f}.js`
      if (fs.existsSync(file)) {
        await require(file).call(this)
        const method = _.upperFirst(f)
        this.bajo.event.emit('boot', [`${method}: ${name}`, `${name}${method}`])
      }
    })
  }
  if (config.verbose) {
    this.bajo.log.debug(`Loaded packages: ${config.bajos.join(', ')}`)
    if (singles.length > 0) {
      this.bajo.log.warn(`Ignored single packages: ${_.map(singles, s => _.camelCase(s)).join(', ')}`)
    }
  }
}
