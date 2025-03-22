import Plugin from './plugin.js'
import lodash from 'lodash'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'
import readAllConfigs from '../lib/read-all-configs.js'
import fs from 'fs-extra'

const { pick, omit, camelCase, trim, without } = lodash

class BajoPlugin extends Plugin {
  constructor (pkgName, app) {
    super(pkgName, app)
    this.state = {}
  }

  loadConfig = async () => {
    const { log, getModuleDir, readJson, defaultsDeep, parseObject } = this.app.bajo
    log.trace('- %s', this.name)
    const dir = this.name === this.app.bajo.mainNs ? (`${this.app.bajo.dir.base}/${this.app.bajo.mainNs}`) : getModuleDir(this.pkgName)
    let cfg = await readAllConfigs.call(this.app, `${dir}/plugin/config`)
    this.alias = this.alias ?? (this.pkgName.slice(0, 5) === 'bajo-' ? this.pkgName.slice(5).toLowerCase() : this.name.toLowerCase())
    const aliasFile = `${dir}/plugin/.alias`
    if (fs.existsSync(aliasFile)) this.alias = fs.readFileSync(aliasFile, 'utf8')
    this.alias = camelCase(this.alias)

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
      this.title = 'Main'
    }
    // merge with config from datadir
    try {
      const altCfg = await readAllConfigs.call(this.app, `${this.app.bajo.dir.data}/config/${this.name}`)
      cfg = defaultsDeep({}, omit(altCfg, omittedPluginKeys), cfg)
    } catch (err) {}
    const envArgv = defaultsDeep({}, omit(this.app.env[this.name] ?? {}, omittedPluginKeys) ?? {}, omit(this.app.argv[this.name] ?? {}, omittedPluginKeys) ?? {})
    cfg = defaultsDeep({}, envArgv ?? {}, cfg ?? {}, this.config ?? {})
    this.title = this.title ?? cfg.title ?? this.app.bajo.titleize(this.alias)

    this.dependencies = this.dependencies ?? []
    const depFile = `${dir}/plugin/.dependencies`
    if (fs.existsSync(depFile)) this.dependencies = without(fs.readFileSync(depFile, 'utf8').split('\n').map(item => trim(item)), '')
    this.config = parseObject(omit(cfg, ['title', 'dependencies']), { parseValue: true })
  }

  _onoff = async (item, ...args) => {
    this.state[item] = false
    const { runHook, importModule } = this.app.bajo
    const mod = await importModule(`${this.dir.pkg}/plugin/${item}.js`)
    if (mod) {
      const text = this.print.write('plugin%s', this.print.write(item))
      this.log.trace(text)
      await runHook(`${this.name}:${camelCase(`before ${item}`)}`)
      await mod.call(this, ...args)
      await runHook(`${this.name}:${camelCase(`after ${item}`)}`)
    }
    this.state[item] = true
  }

  init = async () => {
    await this._onoff('init')
  }

  start = async (...args) => {
    const { freeze } = this.app.bajo
    freeze(this.config)
    await this._onoff('start', ...args)
  }

  stop = async () => {
    await this._onoff('stop')
  }
}

export default BajoPlugin
