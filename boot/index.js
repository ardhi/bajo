import App from './app.js'
import Plugin from './lib/plugin.js'
import buildConfig from './app/build-config.js'
import attachHelper from './app/attach-helper.js'
import bootOrder from './app/boot-order.js'
import bootPlugins from './plugins/index.js'
import exitHandler from './app/exit-handler.js'
import runTool from './app/run-tool.js'
import { last, isFunction } from 'lodash-es'
import resolvePath from './helper/resolve-path.js'
import importModule from './helper/import-module.js'
import readJson from './helper/read-json.js'
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

  const app = new App()
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
