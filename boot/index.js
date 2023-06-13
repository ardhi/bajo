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

const buildConfig = require('./build-config')
const bootOrder = require('./boot-order')
const attachHelper = require('./attach-helper')
const setupBajos = require('./bajos')
const sysReport = require('./sys-report')
const exitHandler = require('./exit-handler')
require('replaceall-shim')

/**
 * The entry point to boot Bajo based application
 *
 * @instance
 * @async
 * @returns {Object} scope
 */

async function boot () {
  const scope = require('./create-scope')()
  await buildConfig.call(scope)
  await attachHelper.call(scope)
  await sysReport.call(scope)
  await bootOrder.call(scope)
  await setupBajos.call(scope)
  await exitHandler.call(scope)
  return scope
}

module.exports = boot
