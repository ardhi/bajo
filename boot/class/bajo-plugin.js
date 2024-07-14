import BasePlugin from './base-plugin.js'
import { pick, isString, omit } from 'lodash-es'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'
import titleize from './bajo-core/method/titleize.js'
import readAllConfigs from '../lib/read-all-configs.js'

class BajoPlugin extends BasePlugin {
  constructor (pkgName, app) {
    super(pkgName, app)
    this.state = {}
  }

  async readConfig () {
    const { getModuleDir, readJson, defaultsDeep } = this.app.bajo
    this.log.trace('Read configuration')
    const dir = this.name === this.app.bajo.mainNs ? (`${this.app.bajo.config.dir.base}/${this.app.bajo.mainNs}`) : getModuleDir(this.pkgName)
    let cfg = await readAllConfigs.call(this.app, `${dir}/bajo/config`)
    cfg.dir = {
      pkg: dir,
      data: `${this.app.bajo.config.dir.data}/plugins/${this.name}`
    }
    const file = `${dir + (this.name === this.app.bajo.mainNs ? '/..' : '')}/package.json`
    const pkgJson = await readJson(file)
    cfg.pkg = pick(pkgJson,
      ['name', 'version', 'description', 'author', 'license', 'homepage'])
    if (cfg.name === this.app.bajo.mainNs) {
      cfg.alias = 'main'
      cfg.title = 'Main App'
    } else if (!isString(cfg.alias)) cfg.alias = this.pkgName.slice(0, 5) === 'bajo-' ? this.pkgName.slice(5).toLowerCase() : this.name // fix. can't be overriden
    cfg.title = cfg.title ?? titleize(cfg.alias)
    // merge with config from datadir
    try {
      const altCfg = await readAllConfigs.call(this.app, `${this.app.bajo.config.dir.data}/config/${this.name}`)
      cfg = defaultsDeep({}, omit(altCfg, omittedPluginKeys), cfg)
    } catch (err) {}
    const envArgv = defaultsDeep({}, omit(this.app.env[cfg.name] ?? {}, omittedPluginKeys) ?? {}, omit(this.app.argv[cfg.name] ?? {}, omittedPluginKeys) ?? {})
    cfg = defaultsDeep({}, envArgv ?? {}, cfg ?? {})
    cfg.dependencies = cfg.dependencies ?? []
    if (isString(cfg.dependencies)) cfg.dependencies = [cfg.dependencies]
    this.config = cfg
  }

  async _onoff (item, beginText, endText) {
    this.state[item] = false
    const { runHook, importModule } = this.app.bajo
    const { camelCase } = this.app.bajo.lib._
    const mod = await importModule(`${this.config.dir.pkg}/bajo/${item}.js`)
    if (mod) {
      this.log.trace(beginText)
      await runHook(`bajo:${camelCase(`before ${item} ${this.name}`)}`)
      await mod.call(this)
      await runHook(`bajo:${camelCase(`after ${item} ${this.name}`)}`)
      this.log.trace(endText)
    }
    this.state[item] = true
  }

  async init () {
    const { freeze } = this.app.bajo
    await this._onoff('init', 'Initializing...', 'Initialized')
    freeze(this.config)
  }

  async start () {
    await this._onoff('start', 'Starting...', 'Started')
  }

  async stop () {
    await this._onoff('stop', 'Stopping...', 'Stopped')
  }
}

export default BajoPlugin
