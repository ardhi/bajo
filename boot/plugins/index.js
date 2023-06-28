import buildConfig from './build-config.js'
import checkDependency from './check-dependency.js'
import attachHelper from './attach-helper.js'
import collectHooks from './collect-hooks.js'
import run from './run.js'
import collectConfigHandlers from './collect-config-handlers.js'
import collectExitHandlers from './collect-exit-handlers.js'
import parseArgsArgv from '../../lib/parse-args-argv.js'
import parseEnv from '../../lib/parse-env.js'

async function bootBajos () {
  const singles = []
  const { argv } = parseArgsArgv() || {}
  const env = parseEnv() || {}

  await collectConfigHandlers.call(this)
  await buildConfig.call(this, { singles, argv, env })
  await checkDependency.call(this)
  await collectExitHandlers.call(this)
  await attachHelper.call(this)
  await collectHooks.call(this)
  await run.call(this, { singles })
}

export default bootBajos