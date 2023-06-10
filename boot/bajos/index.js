const buildConfig = require('./build-config')
const getArgEnv = require('./get-arg-env')
const checkDependency = require('./check-dependency')
const attachHelper = require('./attach-helper')

module.exports = async function () {
  const { _, fs, log, getConfig, walkBajos, freeze, runHook } = this.bajo.helper
  const config = getConfig()

  const c = getArgEnv.call(this)
  const names = []
  const singles = []
  for (const pkg of config.bajos) {
    await buildConfig.call(this, pkg, { names, singles, c })
  }
  _.pull(config.bajos, ...singles)
  _.each(singles, s => delete this[_.camelCase(s)])
  freeze(this.bajo.config)
  await walkBajos(async function ({ name, pkg }) {
    await attachHelper.call(this, name, pkg)
  })
  await walkBajos(async function ({ name, pkg }) {
    await checkDependency.call(this, name, pkg)
  })
  await runHook('bajo:afterCheckDeps')
  const methods = { init: 'Initialization', start: 'Start Services' }
  for (const f of _.keys(methods)) {
    await runHook(`bajo:${_.camelCase(`before ${f} bajo`)}`)
    await walkBajos(async function ({ name, cfg }) {
      const file = `${cfg.dir}/bajo/${f}.js`
      if (fs.existsSync(file)) {
        await runHook(`bajo:${_.camelCase(`before ${f} ${name}`)}`)
        await require(file).call(this)
        await runHook(`bajo:${_.camelCase(`after ${f} ${name}`)}`)
        log.debug(`%s: %s`, methods[f], name)
      }
      if (f === 'init') freeze(cfg)
    })
    await runHook(`bajo:${_.camelCase(`after ${f} bajo`)}`)
  }
  log.trace(`Loaded bajo(s): ${_.map(config.bajos, b => _.camelCase(b)).join(', ')}`)
  if (singles.length > 0) {
    log.warn(`Ignored single bajo(s): ${_.map(singles, s => _.camelCase(s)).join(', ')}`)
  }
}
