import buildConfig from '../../bajo-plugin/helper/build-config.js'
import checkDependency from '../../bajo-plugin/helper/check-dependency.js'
import checkClash from '../../bajo-plugin/helper/check-clash.js'
import attachMethod from '../../bajo-plugin/helper/attach-method.js'
import collectHooks from '../../bajo-plugin/helper/collect-hooks.js'
import run from '../../bajo-plugin/helper/run.js'
import collectExitHandlers from '../../bajo-plugin/helper/collect-exit-handlers.js'

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
