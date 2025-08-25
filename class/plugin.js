import BasePlugin from './base/plugin.js'
import lodash from 'lodash'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'
import readAllConfigs from '../lib/read-all-configs.js'

const { pick, omit } = lodash

/**
 * This is the class that your own plugin suppose to extend. Don't use {@link BasePlugin}
 * unless you know what you're doing.
 *
 * @class
 */

class Plugin extends BasePlugin {
  /**
   * Dependencies to other plugins. Enter all plugin's package name your plugin dependent from.
   *
   * Semver is also supported.
   *
   * @type {string[]}
   * @memberof Plugin
   * @readonly
   */
  static dependencies = []

  /**
   * @param {string} pkgName - Package name (the one you use in package.json)
   * @param {Object} app - App instance reference. Usefull to call app method inside a plugin
   */
  constructor (pkgName, app) {
    super(pkgName, app)
    this.state = {}
  }

  /**
   * Load config from file in data directory, program arguments and environment variables. Level of importance:
   * ```Env Variables > Program Arguments > Config File```
   *
   * @method
   * @async
   */
  loadConfig = async () => {
    const { defaultsDeep } = this.lib.aneka
    const { get, kebabCase } = this.lib._
    const { log, readJson, parseObject, getModuleDir } = this.app.bajo
    log.trace('- %s', this.name)
    const dir = this.name === this.app.bajo.mainNs ? (`${this.app.bajo.dir.base}/${this.app.bajo.mainNs}`) : getModuleDir(this.pkgName)
    let cfg = await readAllConfigs.call(this.app, `${dir}/config`)
    this.constructor.alias = this.alias ?? (this.pkgName.slice(0, 5) === 'bajo-' ? this.pkgName.slice(5).toLowerCase() : this.name.toLowerCase())
    this.constructor.alias = kebabCase(this.alias)

    this.dir = {
      pkg: dir,
      data: `${this.app.bajo.dir.data}/plugins/${this.name}`
    }
    const file = `${dir + (this.name === this.app.bajo.mainNs ? '/..' : '')}/package.json`
    const pkgJson = await readJson(file)
    this.pkg = pick(pkgJson,
      ['name', 'version', 'description', 'author', 'license', 'homepage'])
    if (this.name === this.app.bajo.mainNs) {
      this.constructor.alias = this.app.bajo.mainNs
      this.title = this.title ?? this.alias
    }
    // merge with config from datadir
    try {
      const altCfg = await readAllConfigs.call(this.app, `${this.app.bajo.dir.data}/config/${this.name}`)
      cfg = defaultsDeep({}, omit(altCfg, omittedPluginKeys), cfg)
    } catch (err) {}
    const cfgEnv = omit(get(this, `app.env._.${this.name}`, {}), omittedPluginKeys) ?? {}
    const cfgArgv = omit(get(this, `app.argv._.${this.name}`, {}), omittedPluginKeys) ?? {}
    const envArgv = defaultsDeep({}, cfgEnv, cfgArgv)
    cfg = defaultsDeep({}, envArgv ?? {}, cfg ?? {}, this.config ?? {})
    this.title = this.title ?? cfg.title ?? this.alias
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
  }
}

export default Plugin
