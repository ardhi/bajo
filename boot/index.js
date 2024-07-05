import Core from './core.js'
import Plugin from './plugin.js'
import buildConfig from './core/build-config.js'
import attachHelper from './core/attach-helper.js'
import bootOrder from './core/boot-order.js'
import bootPlugins from './plugin/index.js'
import exitHandler from './core/exit-handler.js'
import runTool from './core/run-tool.js'
import { last, isFunction } from 'lodash-es'
import resolvePath from './core/helper/resolve-path.js'
import importModule from './core/helper/import-module.js'
import readJson from './core/helper/read-json.js'
import shim from './lib/shim.js'

shim()

async function defHandler (file) {
  let mod = await importModule(file)
  if (isFunction(mod)) mod = await mod.call(this)
  return mod
}

async function boot (cwd) {
  if (!cwd) cwd = process.cwd()
  const l = last(process.argv)
  if (l.startsWith('--cwd')) {
    const parts = l.split('=')
    cwd = parts[1]
  }
  cwd = resolvePath(cwd)
  process.env.BAJOCWD = cwd

  const app = new Core()
  const bajo = new Plugin('bajo', app)
  bajo.configHandlers = [
    { ext: '.js', handler: defHandler },
    { ext: '.mjs', handler: defHandler },
    { ext: '.json', handler: readJson }
  ]
  app.addPlugin(bajo)
  await buildConfig.call(app, cwd)
  await attachHelper.call(app)
  await bootOrder.call(app)
  await bootPlugins.call(app)
  await exitHandler.call(app)
  // boot complete
  await app.bajo.helper.runHook('bajo:bootComplete')
  const elapsed = new Date() - app.runAt
  app.bajo.log.info('Boot process completed in %s', app.bajo.helper.secToHms(elapsed, true))
  // run tool
  await runTool.call(app)
  return app
}

export default boot
