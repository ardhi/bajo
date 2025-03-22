import util from 'util'
import lodash from 'lodash'
import BajoCore from './bajo-core.js'
import resolvePath from '../lib/resolve-path.js'
import parseArgsArgv from '../lib/parse-args-argv.js'
import parseEnv from '../lib/parse-env.js'
import buildPlugins from './bajo-core/build-plugins.js'
import { buildBaseConfig, buildExtConfig } from './bajo-core/build-config.js'
import collectConfigHandlers from './bajo-core/collect-config-handlers.js'
import bootOrder from './bajo-core/boot-order.js'
import bootPlugins from './bajo-core/boot-plugins.js'
import exitHandler from './bajo-core/exit-handler.js'
import runAsApplet from './bajo-core/run-as-applet.js'

const { last } = lodash

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

  addPlugin = (plugin) => {
    if (this[plugin.name]) throw new Error(`Plugin '${plugin.name}' added already`)
    this[plugin.name] = plugin
  }

  dump = (...args) => {
    const terminate = last(args) === true
    if (terminate) args.pop()
    for (const arg of args) {
      const result = util.inspect(arg, false, null, true)
      console.log(result)
    }
    if (terminate) process.kill(process.pid, 'SIGINT')
  }

  boot = async () => {
    // argv/args
    const { args, argv } = await parseArgsArgv.call(this.app) ?? {}
    this.argv = argv
    this.args = args
    this.env = parseEnv() ?? {}

    const bajo = new BajoCore(this)
    await buildBaseConfig.call(bajo)
    await buildPlugins.call(bajo)
    await collectConfigHandlers.call(bajo)
    await buildExtConfig.call(bajo)
    await bootOrder.call(bajo)
    await bootPlugins.call(bajo)
    await exitHandler.call(bajo)
    // boot complete
    const elapsed = new Date() - bajo.runAt
    bajo.log.info('bootCompleted%s', bajo.secToHms(elapsed, true))
    await bajo.runHook('bajo:afterBootComplete')
    if (bajo.applet) await runAsApplet.call(bajo)
  }
}

export default App
