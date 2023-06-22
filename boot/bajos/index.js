import buildConfig from './build-config.js'
import checkDependency from './check-dependency.js'
import attachHelper from './attach-helper.js'
import collectListeners from './collect-listeners.js'
import collectConfigHandlers from './collect-config-handlers.js'
import parseArgsArgv from '../../lib/parse-args-argv.js'
import parseEnv from '../../lib/parse-env.js'
import importModule from '../../helper/import-module.js'

export default async function () {
  const { _, fs, log, getConfig, walkBajos, freeze, setHook } = this.bajo.helper
  const config = getConfig()
  const names = []
  const singles = []
  const { argv } = parseArgsArgv() || {}
  const env = parseEnv() || {}

  await collectConfigHandlers.call(this)
  await buildConfig.call(this, { names, singles, argv, env })
  await checkDependency.call(this)
  await attachHelper.call(this)
  await collectListeners.call(this)

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
  log.debug(`Loaded bajo(s): ${_.map(config.bajos, b => _.camelCase(b)).join(', ')}`)
  if (singles.length > 0) {
    log.warn(`Ignored single bajo(s): ${_.map(singles, s => _.camelCase(s)).join(', ')}`)
  }
}
