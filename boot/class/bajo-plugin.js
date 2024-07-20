import Plugin from './plugin.js'
import { pick, isString, omit, isEmpty } from 'lodash-es'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'
import titleize from './bajo-core/method/titleize.js'
import readAllConfigs from '../lib/read-all-configs.js'

class BajoPlugin extends Plugin {
  constructor (pkgName, app) {
    super(pkgName, app)
    this.state = {}
  }

  async loadConfig () {
    const { log, getModuleDir, readJson, defaultsDeep } = this.app.bajo
    log.trace('- %s', this.name)
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
    if (this.name === this.app.bajo.mainNs) {
      cfg.alias = this.app.bajo.mainNs
      cfg.title = 'Main App'
    } else if (isEmpty(cfg.alias)) cfg.alias = this.pkgName.slice(0, 5) === 'bajo-' ? this.pkgName.slice(5).toLowerCase() : this.name // fix. can't be overriden
    this.alias = cfg.alias
    delete cfg.alias
    cfg.title = cfg.title ?? titleize(this.alias)
    // merge with config from datadir
    try {
      const altCfg = await readAllConfigs.call(this.app, `${this.app.bajo.config.dir.data}/config/${this.name}`)
      cfg = defaultsDeep({}, omit(altCfg, omittedPluginKeys), cfg)
    } catch (err) {}
    const envArgv = defaultsDeep({}, omit(this.app.env[this.name] ?? {}, omittedPluginKeys) ?? {}, omit(this.app.argv[this.name] ?? {}, omittedPluginKeys) ?? {})
    cfg = defaultsDeep({}, envArgv ?? {}, cfg ?? {})
    cfg.dependencies = cfg.dependencies ?? []
    if (isString(cfg.dependencies)) cfg.dependencies = [cfg.dependencies]
    this.config = cfg
  }

  async _onoff (item, text, ...args) {
    this.state[item] = false
    const { runHook, importModule } = this.app.bajo
    const { camelCase } = this.app.bajo.lib._
    const mod = await importModule(`${this.config.dir.pkg}/bajo/${item}.js`)
    if (mod) {
      this.log.trace(text)
      await runHook(`${this.name}:${camelCase(`before ${item}`)}`)
      await mod.call(this, ...args)
      await runHook(`${this.name}:${camelCase(`after ${item}`)}`)
    }
    this.state[item] = true
  }

  async init () {
    const { freeze } = this.app.bajo
    await this._onoff('init', 'Init plugin...')
    freeze(this.config)
  }

  async start (...args) {
    await this._onoff('start', 'Start plugin...', ...args)
  }

  async stop () {
    await this._onoff('stop', 'Stop plugin...')
  }
}

export default BajoPlugin
