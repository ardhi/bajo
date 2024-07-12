import App from './class/app.js'
import BajoCore from './class/bajo-core.js'
import attachMethod from './class/core-helper/attach-method.js'
import bootOrder from './class/core-helper/boot-order.js'
import bootPlugins from './class/plugin-helper/index.js'
import exitHandler from './class/core-helper/exit-handler.js'
import runTool from './class/core-helper/run-tool.js'
import { last } from 'lodash-es'
import resolvePath from './class/core-method/resolve-path.js'
import shim from './lib/shim.js'

shim()

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
  // bajo
  const bajo = new BajoCore(app)
  await bajo.buildBaseConfig(cwd)
  await bajo.buildPlugins()
  await bajo.collectConfigHandlers()
  await bajo.buildConfig()
  // helper to boot app
  await attachMethod.call(app)
  await bootOrder.call(app)
  await bootPlugins.call(app)
  await exitHandler.call(app)
  // boot complete
  await app.bajo.runHook('bajo:bootComplete')
  const elapsed = new Date() - app.runAt
  app.bajo.log.info('Boot process completed in %s', app.bajo.secToHms(elapsed, true))
  await runTool.call(app)
  return app
}

export default boot
