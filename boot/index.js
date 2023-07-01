/**
 * Boot process:
 * 1. [Creating scope]{@link module:boot/createScope}
 * 2. [Building config object]{@link module:boot/buildConfig}
 * 3. Attaching helpers
 * 4. Attaching system report
 * 5. Determine boot orders
 * 6. Register plugins
 * 7. Attaching exit handlers
 * @module boot
 */

import createScope from './create-scope.js'
import buildConfig from './build-config.js'
import attachHelper from './attach-helper.js'
import bootOrder from './boot-order.js'
import bootPlugins from './plugins/index.js'
import exitHandler from './exit-handler.js'
import shim from './lib/shim.js'

shim()

/**
 * The entry point to boot Bajo based application
 *
 * @instance
 * @async
 * @returns {Object} scope
 */

async function boot (cwd = process.cwd()) {
  const scope = createScope()
  await buildConfig.call(scope, cwd)
  await attachHelper.call(scope)
  await bootOrder.call(scope)
  await bootPlugins.call(scope)
  await exitHandler.call(scope)
  // complete
  const { runHook, log } = scope.bajo.helper
  await runHook('bajo:bootComplete')
  const elapsed = (new Date() - scope.bajo.runAt).toLocaleString()
  log.info('Boot process completed in %sms', elapsed)
  return scope
}

export default boot
