import createApp from './app.js'
import buildConfig from './core/build-config.js'
import attachHelper from './core/attach-helper.js'
import bootOrder from './core/boot-order.js'
import bootPlugins from './plugin/index.js'
import exitHandler from './core/exit-handler.js'
import runTool from './core/run-tool.js'
import { last } from 'lodash-es'
import resolvePath from './core/helper/resolve-path.js'
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

  const app = await createApp(cwd)
  await buildConfig.call(app, cwd)
  await attachHelper.call(app)
  await bootOrder.call(app)
  await bootPlugins.call(app)
  await exitHandler.call(app)
  // boot complete
  await app.bajo.helper.runHook('bajo:bootComplete')
  const elapsed = new Date() - app.runAt
  app.bajo.log.info('Boot process completed in %s', app.bajo.helper.secToHms(elapsed, true))
  await runTool.call(app)
  return app
}

export default boot
