import buildConfig from './build-config.js'
import extendConfig from './extend-config.js'
import checkDependency from './check-dependency.js'
import checkClash from './check-clash.js'
import attachHelper from './attach-helper.js'
import collectHooks from './collect-hooks.js'
import run from './run.js'
import collectConfigHandlers from './collect-config-handlers.js'
import collectExitHandlers from './collect-exit-handlers.js'
import parseArgsArgv from '../lib/parse-args-argv.js'
import parseEnv from '../lib/parse-env.js'

async function bootBajos () {
  const { argv } = await parseArgsArgv({ useParser: true }) ?? {}
  const env = parseEnv() ?? {}
  await collectConfigHandlers.call(this)
  await buildConfig.call(this, { argv, env })
  await extendConfig.call(this)
  await checkClash.call(this)
  await checkDependency.call(this)
  await attachHelper.call(this)
  await collectHooks.call(this)
  await run.call(this)
  await collectExitHandlers.call(this)
}

export default bootBajos
