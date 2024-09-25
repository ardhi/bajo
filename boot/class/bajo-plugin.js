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
    const dir = this.name === this.app.bajo.mainNs ? (`${this.app.bajo.dir.base}/${this.app.bajo.mainNs}`) : getModuleDir(this.pkgName)
    let cfg = await readAllConfigs.call(this.app, `${dir}/bajo/config`)
    this.dir = {
      pkg: dir,
      data: `${this.app.bajo.dir.data}/plugins/${this.name}`
    }
    const file = `${dir + (this.name === this.app.bajo.mainNs ? '/..' : '')}/package.json`
    const pkgJson = await readJson(file)
    this.pkg = pick(pkgJson,
      ['name', 'version', 'description', 'author', 'license', 'homepage'])
    if (this.name === this.app.bajo.mainNs) {
      this.alias = this.app.bajo.mainNs
      this.title = 'Main App'
    } else if (isEmpty(cfg.alias)) this.alias = this.pkgName.slice(0, 5) === 'bajo-' ? this.pkgName.slice(5).toLowerCase() : this.name
    this.title = this.title ?? cfg.title ?? titleize(this.alias)
    this.alias = this.alias ?? cfg.alias
    // merge with config from datadir
    try {
      const altCfg = await readAllConfigs.call(this.app, `${this.app.bajo.dir.data}/config/${this.name}`)
      cfg = defaultsDeep({}, omit(altCfg, omittedPluginKeys), cfg)
    } catch (err) {}
    const envArgv = defaultsDeep({}, omit(this.app.env[this.name] ?? {}, omittedPluginKeys) ?? {}, omit(this.app.argv[this.name] ?? {}, omittedPluginKeys) ?? {})
    cfg = defaultsDeep({}, envArgv ?? {}, cfg ?? {})
    this.dependencies = cfg.dependencies ?? []
    if (isString(this.dependencies)) this.dependencies = [this.dependencies]
    this.config = omit(cfg, ['alias', 'title', 'dependencies'])
  }

  async _onoff (item, text, ...args) {
    this.state[item] = false
    const { runHook, importModule } = this.app.bajo
    const { camelCase } = this.app.bajo.lib._
    const mod = await importModule(`${this.dir.pkg}/bajo/${item}.js`)
    if (mod) {
      this.log.trace(text)
      await runHook(`${this.name}:${camelCase(`before ${item}`)}`)
      await mod.call(this, ...args)
      await runHook(`${this.name}:${camelCase(`after ${item}`)}`)
    }
    this.state[item] = true
  }

  async init () {
    await this._onoff('init', 'Init plugin...')
  }

  async start (...args) {
    const { freeze } = this.app.bajo
    freeze(this.config)
    await this._onoff('start', 'Start plugin...', ...args)
  }

  async stop () {
    await this._onoff('stop', 'Stop plugin...')
  }
}

export default BajoPlugin
