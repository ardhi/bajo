import util from 'util'
import lodash from 'lodash'
import Bajo from './bajo.js'
import resolvePath from '../lib/resolve-path.js'
import parseArgsArgv from '../lib/parse-args-argv.js'
import parseEnv from '../lib/parse-env.js'
import {
  buildBaseConfig,
  buildExtConfig,
  buildPlugins,
  collectConfigHandlers,
  bootOrder,
  bootPlugins,
  exitHandler,
  runAsApplet
} from './helper/bajo.js'

const { last } = lodash

/**
 * App class. This is where everything starts, the boot process:
 *
 * 1. Parsing all arguments and environment values
 * 2. Create {@link Bajo|Bajo} instance
 * 3. Building {@link module:class/helper/bajo.buildBaseConfig|base config}
 * 4. {@link module:class/helper/bajo.buildPlugins|Building plugins}
 * 5. Collect all {@link module:class/helper/bajo.collectConfigHandlers|config handler}
 * 6. Building {@link module:class/helper/bajo.buildExtConfig|extra config}
 * 7. Setup {@link module:class/helper/bajo.bootOrder|boot order}
 * 8. {@link module:class/helper/bajo.bootPlugins|Boot loaded plugins}
 * 9. Attach {@link module:class/helper/bajo.exitHandler|exit handlers}
 * 10. Finish
 *
 * After boot process is completed, event ```bajo:afterBootComplete``` is emitted.
 *
 * If app mode is ```applet```, it runs your choosen applet instead.
 *
 * @class
 */
class App {
  /**
   * Class constructor
   *
   * @param {string} cwd - Current working dirctory
   */
  constructor (cwd) {
    if (!cwd) cwd = process.cwd()
    const l = last(process.argv)
    if (l.startsWith('--cwd')) {
      const parts = l.split('=')
      cwd = parts[1]
    }
    this.dir = resolvePath(cwd)
    this.pluginFactory = {}
    process.env.APPDIR = this.dir
  }

  /**
   * Add a plugin to the app
   *
   * @method
   * @param {Object} plugin - A valid bajo plugin
   */
  addPlugin = (plugin, factory) => {
    if (this[plugin.name]) throw new Error(`Plugin '${plugin.name}' added already`)
    this[plugin.name] = plugin
    if (factory) this.pluginFactory[plugin.name] = factory
  }

  /**
   * Get all loaded plugin names
   *
   * @returns {string[]}
   */
  getPluginNames = () => {
    return Object.keys(this.pluginFactory)
  }

  /**
   * Dumping variable on screen
   *
   * @method
   * @param  {...any} args - any arguments passed will be displayed on screen. If the last argument is a boolean 'true', app will quit rightaway
   */
  dump = (...args) => {
    const terminate = last(args) === true
    if (terminate) args.pop()
    for (const arg of args) {
      const result = util.inspect(arg, false, null, true)
      console.log(result)
    }
    if (terminate) process.kill(process.pid, 'SIGINT')
  }

  /**
   * Booting the app
   *
   * @method
   * @async
   */
  boot = async () => {
    // argv/args
    const { args, argv } = await parseArgsArgv.call(this.app) ?? {}
    this.argv = argv
    this.args = args
    this.env = parseEnv() ?? {}

    const bajo = new Bajo(this)
    await buildBaseConfig.call(bajo)
    await buildPlugins.call(bajo)
    await collectConfigHandlers.call(bajo)
    await buildExtConfig.call(bajo)
    await bootOrder.call(bajo)
    await bootPlugins.call(bajo)
    await exitHandler.call(bajo)
    // boot complete
    const elapsed = new Date() - bajo.runAt
    bajo.log.info('bootCompleted%s', bajo.lib.aneka.secToHms(elapsed, true))
    await bajo.runHook('bajo:afterBootComplete')
    if (bajo.applet) await runAsApplet.call(bajo)
  }
}

export default App
