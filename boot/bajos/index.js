import buildConfig from './build-config.js'
import checkDependency from './check-dependency.js'
import attachHelper from './attach-helper.js'
import parseArgsArgv from '../../lib/parse-args-argv.js'
import parseEnv from '../../lib/parse-env.js'
import importModule from '../../helper/import-module.js'

export default async function () {
  const { _, fs, log, getConfig, walkBajos, freeze, setHook, pathResolve } = this.bajo.helper
  const config = getConfig()
  const names = []
  const singles = []
  const { argv } = parseArgsArgv() || {}
  const env = parseEnv() || {}

  for (const pkg of config.bajos) {
    await buildConfig.call(this, pkg, { names, singles, argv, env })
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
  await setHook('bajo:afterCheckDeps')
  const methods = { init: 'Initialization', start: 'Start Services' }
  for (const f of _.keys(methods)) {
    await setHook(`bajo:${_.camelCase(`before ${f} bajo`)}`)
    await walkBajos(async function ({ name, cfg }) {
      const file = `${cfg.dir}/bajo/${f}.js`
      if (fs.existsSync(file)) {
        await setHook(`bajo:${_.camelCase(`before ${f} ${name}`)}`)
        const item = await importModule.handler(file)
        await item.call(this)
        await setHook(`bajo:${_.camelCase(`after ${f} ${name}`)}`)
        log.debug(`%s: %s`, methods[f], name)
      }
      if (f === 'init') freeze(cfg)
    })
    await setHook(`bajo:${_.camelCase(`after ${f} bajo`)}`)
  }
  log.trace(`Loaded bajo(s): ${_.map(config.bajos, b => _.camelCase(b)).join(', ')}`)
  if (singles.length > 0) {
    log.warn(`Ignored single bajo(s): ${_.map(singles, s => _.camelCase(s)).join(', ')}`)
  }
}
