import { camelCase, pick, isString, omit } from 'lodash-es'
import fs from 'fs-extra'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'
import titleize from '../core/helper/titleize.js'

export async function readAllConfigs (base, name) {
  const { readConfig } = this.bajo.helper
  let cfg = {}
  try {
    cfg = await readConfig(`${base}-${this.bajo.config.env}.*`)
  } catch (err) {
    if (['BAJO_CONFIG_NO_PARSER'].includes(err.code)) throw err
    if (['BAJO_CONFIG_FILE_NOT_FOUND'].includes(err.code)) {
      try {
        cfg = await readConfig(`${base}.*`)
      } catch (err) {
        if (!['BAJO_CONFIG_FILE_NOT_FOUND'].includes(err.code)) throw err
      }
    }
  }
  cfg.name = name
  return cfg
}

async function runner (pkg, { argv, env }) {
  const { getModuleDir, readConfig, error, readJson, defaultsDeep } = this.bajo.helper
  const name = camelCase(pkg)
  this.bajo.log.trace('Read configuration: %s', name)
  const dir = pkg === 'main' ? (this.bajo.config.dir.base + '/main') : getModuleDir(pkg)
  if (pkg !== 'main' && !fs.existsSync(`${dir}/bajo`)) throw error('Package \'%s\' isn\'t a valid Bajo package', pkg, { code: 'BAJO_INVALID_PACKAGE' })
  let cfg = await readAllConfigs.call(this, `${dir}/bajo/config`, name)
  cfg.dir = {
    pkg: dir,
    data: `${this.bajo.config.dir.data}/plugins/${name}`
  }
  const pkgJson = await readJson(`${dir + (pkg === 'main' ? '/..' : '')}/package.json`)
  cfg.pkg = pick(pkgJson,
    ['name', 'version', 'description', 'author', 'license', 'homepage'])
  if (cfg.name === 'main') {
    cfg.alias = 'main'
    cfg.title = 'Main App'
  } else if (!isString(cfg.alias)) cfg.alias = pkg.slice(0, 5) === 'bajo-' ? pkg.slice(5).toLowerCase() : pkg // fix. can't be overriden
  cfg.title = cfg.title ?? titleize.call(this, cfg.alias)
  // merge with config from datadir
  try {
    const altCfg = await readConfig(`${this.bajo.config.dir.data}/config/${cfg.name}.*`)
    cfg = defaultsDeep({}, omit(altCfg, omittedPluginKeys), cfg)
  } catch (err) {}
  const envArgv = defaultsDeep({}, omit(env[cfg.name] ?? {}, omittedPluginKeys) ?? {}, omit(argv[cfg.name] ?? {}, omittedPluginKeys) ?? {})
  cfg = defaultsDeep({}, envArgv ?? {}, cfg ?? {})
  cfg.dependencies = cfg.dependencies ?? []
  if (isString(cfg.dependencies)) cfg.dependencies = [cfg.dependencies]
  this[name].config = cfg
  this[name].log.init()
}

async function buildConfig ({ argv, env }) {
  const { freeze } = this.bajo.helper
  this.bajo.log.debug('Read configurations')
  for (const pkg of this.bajo.config.plugins) {
    await runner.call(this, pkg, { argv, env })
  }
  freeze(this.bajo.config)
}

export default buildConfig
