/**
 * Boot process:
 * 1. [Creating scope]{@link module:boot/createScope}
 * 2. [Building config object]{@link module:boot/buildConfig}
 * 3. Attaching helpers
 * 4. Attaching system report
 * 5. Determine boot orders
 * 6. Register Bajos/plugins
 * 7. Attaching exit handlers
 * @module boot
 */

import createScope from './create-scope.js'
import buildConfig from './build-config.js'
import attachHelper from './attach-helper.js'
import sysReport from './sys-report.js'
import bootOrder from './boot-order.js'
import setupBajos from './bajos/index.js'
import exitHandler from './exit-handler.js'
import shim from '../lib/shim.js'

shim()

/**
 * The entry point to boot Bajo based application
 *
 * @instance
 * @async
 * @returns {Object} scope
 */

async function boot () {
  const scope = createScope()
  await buildConfig.call(scope)
  await attachHelper.call(scope)
  // await sysReport.call(scope)
  await bootOrder.call(scope)
  await setupBajos.call(scope)
  await exitHandler.call(scope)
  return scope
}

export default boot
