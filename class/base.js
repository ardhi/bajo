import Plugin from './plugin.js'

/**
 * This is the class that your own plugin suppose to extend. Don't use {@link Plugin} directly
 * unless you know what you're doing.
 *
 * @class
 */

class Base extends Plugin {
  /**
   * @param {string} pkgName - Package name (the one you use in package.json)
   * @param {Object} app - App instance reference. Usefull to call app method inside a plugin
   */
  constructor (pkgName, app) {
    super(pkgName, app)

    /**
     * Dependencies to other plugins. Enter all plugin's package name your plugin dependent from.
     *
     * Semver is also supported.
     *
     * @constant {string[]}
     * @memberof Base
     */
    this.dependencies = []

    this.state = {}
    this.pkg = {}
  }

  /**
   * Load config from file in data directory, program arguments and environment variables. Level of importance:
   * ```Env Variables > Program Arguments > Config File```
   *
   * @method
   * @async
   */
  loadConfig = async () => {
    const { defaultsDeep } = this.app.lib.aneka
    const { get, keys, pick, isEmpty } = this.app.lib._
    const { log, getModuleDir, readAllConfigs } = this.app.bajo
    const { parseObject } = this.app.lib

    const defKeys = keys(this.config)
    log.trace('- %s', this.ns)
    const dir = this.ns === this.app.mainNs ? (`${this.app.bajo.dir.base}/${this.app.mainNs}`) : getModuleDir(this.pkgName)
    let cfg = await readAllConfigs(`${dir}/config`)

    this.dir = {
      pkg: dir,
      data: `${this.app.bajo.dir.data}/plugins/${this.ns}`
    }
    // merge with config from datadir
    try {
      let altCfg = get(this, `app.options.config.${this.ns}`, {})
      if (isEmpty(altCfg)) altCfg = await readAllConfigs(`${this.app.bajo.dir.data}/config/${this.ns}`)
      cfg = defaultsDeep({}, altCfg, cfg)
    } catch (err) {}
    const cfgEnv = get(this, `app.env.${this.ns}`, {})
    const cfgArgv = get(this, `app.argv.${this.ns}`, {})
    const envArgv = defaultsDeep({}, cfgEnv, cfgArgv)
    cfg = pick(defaultsDeep({}, envArgv ?? {}, cfg ?? {}, this.config ?? {}), defKeys)
    this.config = parseObject(cfg, { parseValue: true })
  }

  /**
   * After config is read, plugin will be initialized. You can still change your config here,
   * because after plugin is initialized, config will be deep frozen.
   *
   * @method
   * @async
   */
  init = async () => {
  }

  /**
   * This method will be called after plugin's init
   *
   * @method
   * @async
   */
  start = async () => {
  }

  stop = async () => {
  }

  /**
   * Upon app termination, this method will be called first. Mostly useful for system cleanup,
   * delete temporary files, freeing resources etc.
   *
   * @method
   * @async
   */
  exit = async () => {
    this.dispose()
  }

  /**
   * Dispose internal references
   */
  dispose = () => {
    super.dispose()
    this.state = null
  }
}

export default Base
