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
import _ from 'lodash'
import path from 'path'
import pathResolve from './helper/path-resolve.js'

shim()

/**
 * The entry point to boot Bajo based application
 *
 * @instance
 * @async
 * @returns {Object} scope
 */

async function boot (cwd) {
  if (!cwd) cwd = path.dirname(process.argv[1])
  const last = _.last(process.argv)
  if (last.startsWith('--cwd')) {
    const parts = last.split('=')
    cwd = parts[1]
  }
  cwd = pathResolve(cwd)
  process.env.BAJOCWD = cwd
  const scope = createScope()
  await buildConfig.call(scope, cwd)
  await attachHelper.call(scope)
  await bootOrder.call(scope)
  await bootPlugins.call(scope)
  if (scope.bajo.config.run.exitHandler) await exitHandler.call(scope)
  // boot complete
  const { runHook, log } = scope.bajo.helper
  await runHook('bajo:bootComplete')
  const elapsed = (new Date() - scope.bajo.runAt).toLocaleString()
  log.info('Boot process completed in %sms', elapsed)
  // run tool
  await runTool.call(scope)
  return scope
}

export default boot
