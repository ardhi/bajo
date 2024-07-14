import util from 'util'
import { last } from 'lodash-es'
import BajoCore from './bajo-core.js'
import resolvePath from './bajo-core/method/resolve-path.js'
import parseArgsArgv from '../lib/parse-args-argv.js'
import parseEnv from '../lib/parse-env.js'
import buildBaseConfig from './bajo-core/helper/build-base-config.js'
import buildPlugins from './bajo-core/helper/build-plugins.js'
import buildConfig from './bajo-core/helper/build-config.js'
import collectConfigHandlers from './bajo-core/helper/collect-config-handlers.js'
import attachMethod from './bajo-core/helper/attach-method.js'
import bootOrder from './bajo-core/helper/boot-order.js'
import bootPlugins from './bajo-core/helper/boot-plugins.js'
import exitHandler from './bajo-core/helper/exit-handler.js'
import runTool from './bajo-core/helper/run-tool.js'

class App {
  constructor (cwd) {
    if (!cwd) cwd = process.cwd()
    const l = last(process.argv)
    if (l.startsWith('--cwd')) {
      const parts = l.split('=')
      cwd = parts[1]
    }
    cwd = resolvePath(cwd)
    process.env.BAJOCWD = cwd
    this.cwd = cwd
  }

  addPlugin (plugin) {
    if (this[plugin.name]) throw new Error(`Plugin '${plugin.name}' added already`)
    this[plugin.name] = plugin
    plugin.initPrint()
  }

  dump (...args) {
    const terminate = last(args) === true
    if (terminate) args.pop()
    for (const arg of args) {
      const result = util.inspect(arg, false, null, true)
      console.log(result)
    }
    if (terminate) process.kill(process.pid, 'SIGINT')
  }

  async boot () {
    // argv/args
    const { args, argv } = await parseArgsArgv.call(this.app) ?? {}
    this.argv = argv
    this.args = args
    this.env = parseEnv() ?? {}

    const bajo = new BajoCore(this)
    await buildBaseConfig.call(bajo)
    await buildPlugins.call(bajo)
    await collectConfigHandlers.call(bajo)
    await buildConfig.call(bajo)
    await attachMethod.call(bajo)
    await bootOrder.call(bajo)
    await bootPlugins.call(bajo)
    await exitHandler.call(bajo)
    // boot complete
    await bajo.runHook('bajo:bootComplete')
    const elapsed = new Date() - bajo.runAt
    bajo.log.info('Boot process completed in %s', bajo.secToHms(elapsed, true))
    await runTool.call(bajo)
  }
}

export default App
