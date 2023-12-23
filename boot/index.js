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
import runTool from './run-tool.js'
import shim from './lib/shim.js'
import { last } from 'lodash-es'
import resolvePath from './helper/resolve-path.js'

shim()

/**
 * The entry point to boot Bajo based application
 *
 * @instance
 * @async
 * @returns {Object} scope
 */

async function boot (cwd) {
  if (!cwd) cwd = process.cwd()
  const l = last(process.argv)
  if (l.startsWith('--cwd')) {
    const parts = l.split('=')
    cwd = parts[1]
  }
  cwd = resolvePath(cwd)
  process.env.BAJOCWD = cwd
  const scope = createScope()
  await buildConfig.call(scope, cwd)
  await attachHelper.call(scope)
  await bootOrder.call(scope)
  await bootPlugins.call(scope)
  await exitHandler.call(scope)
  // boot complete
  const { runHook, log } = scope.bajo.helper
  await runHook('bajo:bootComplete')
  const elapsed = new Date() - scope.bajo.runAt
  log.info('Boot process completed in %s', scope.bajo.helper.secToHms(elapsed, true))
  // run tool
  await runTool.call(scope)
  return scope
}

export default boot
