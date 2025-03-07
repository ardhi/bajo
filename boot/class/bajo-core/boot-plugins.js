import buildConfig from '../bajo-plugin/build-config.js'
import checkDependency from '../bajo-plugin/check-dependency.js'
import checkClash from '../bajo-plugin/check-clash.js'
import attachMethod from '../bajo-plugin/attach-method.js'
import collectHooks from '../bajo-plugin/collect-hooks.js'
import run from '../bajo-plugin/run.js'
import collectExitHandlers from '../bajo-plugin/collect-exit-handlers.js'

async function bootPlugins () {
  await buildConfig.call(this.app)
  await checkClash.call(this.app)
  await checkDependency.call(this.app)
  await attachMethod.call(this.app)
  await collectHooks.call(this.app)
  await collectExitHandlers.call(this.app)
  await run.call(this.app)
}

export default bootPlugins
