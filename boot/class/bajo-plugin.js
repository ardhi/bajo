import Plugin from './plugin.js'
import lodash from 'lodash'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'
import readAllConfigs from '../lib/read-all-configs.js'

const { pick, omit } = lodash

class BajoPlugin extends Plugin {
  constructor (pkgName, app) {
    super(pkgName, app)
    this.state = {}
  }

  loadConfig = async () => {
    const { defaultsDeep } = this.lib.aneka
    const { log, readJson, parseObject, getModuleDir } = this.app.bajo
    log.trace('- %s', this.name)
    const dir = this.name === this.app.bajo.mainNs ? (`${this.app.bajo.dir.base}/${this.app.bajo.mainNs}`) : getModuleDir(this.pkgName)
    let cfg = await readAllConfigs.call(this.app, `${dir}/config`)
    this.alias = this.alias ?? (this.pkgName.slice(0, 5) === 'bajo-' ? this.pkgName.slice(5).toLowerCase() : this.name.toLowerCase())
    this.alias = this.alias.toLowerCase()

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
      this.title = this.title ?? this.alias
    }
    // merge with config from datadir
    try {
      const altCfg = await readAllConfigs.call(this.app, `${this.app.bajo.dir.data}/config/${this.name}`)
      cfg = defaultsDeep({}, omit(altCfg, omittedPluginKeys), cfg)
    } catch (err) {}
    const envArgv = defaultsDeep({}, omit(this.app.env[this.name] ?? {}, omittedPluginKeys) ?? {}, omit(this.app.argv[this.name] ?? {}, omittedPluginKeys) ?? {})
    cfg = defaultsDeep({}, envArgv ?? {}, cfg ?? {}, this.config ?? {})
    this.title = this.title ?? cfg.title ?? this.alias

    this.dependencies = this.dependencies ?? []
    this.config = parseObject(cfg, { parseValue: true })
  }

  init = async () => {
  }

  start = async () => {
  }

  stop = async () => {
  }
}

export default BajoPlugin
