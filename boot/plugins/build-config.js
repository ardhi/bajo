import { camelCase, pick, isString, omit } from 'lodash-es'
import fs from 'fs-extra'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'
import titleize from '../helper/titleize.js'

export async function readAllConfigs (base, name) {
  const { readConfig, getConfig } = this.bajo.helper
  const config = getConfig()
  let cfg = {}
  try {
    cfg = await readConfig(`${base}-${config.env}.*`)
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
  const { log, getConfig, getModuleDir, readConfig, error, readJson, defaultsDeep } = this.bajo.helper
  const config = getConfig()
  const name = camelCase(pkg)
  log.trace('Read configuration: %s', name)
  const dir = pkg === 'app' ? (config.dir.base + '/app') : getModuleDir(pkg)
  if (pkg !== 'app' && !fs.existsSync(`${dir}/bajo`)) throw error('Package \'%s\' isn\'t a valid Bajo package', pkg, { code: 'BAJO_INVALID_PACKAGE' })
  let cfg = await readAllConfigs.call(this, `${dir}/bajo/config`, name)
  cfg.dir = {
    pkg: dir,
    data: `${config.dir.data}/plugins/${name}`
  }
  const pkgJson = await readJson(`${dir + (pkg === 'app' ? '/..' : '')}/package.json`)
  cfg.pkg = pick(pkgJson,
    ['name', 'version', 'description', 'author', 'license', 'homepage'])
  if (cfg.name === 'app') {
    cfg.alias = 'app'
    cfg.title = 'Application'
  } else if (!isString(cfg.alias)) cfg.alias = pkg.slice(0, 5) === 'bajo-' ? pkg.slice(5).toLowerCase() : pkg // fix. can't be overriden
  cfg.title = cfg.title ?? titleize.call(this, cfg.alias)
  // merge with config from datadir
  try {
    const altCfg = await readConfig(`${config.dir.data}/config/${cfg.name}.*`)
    cfg = defaultsDeep({}, omit(altCfg, omittedPluginKeys), cfg)
  } catch (err) {}
  const envArgv = defaultsDeep({}, omit(env[cfg.name] ?? {}, omittedPluginKeys) ?? {}, omit(argv[cfg.name] ?? {}, omittedPluginKeys) ?? {})
  cfg = defaultsDeep({}, envArgv ?? {}, cfg ?? {})
  cfg.dependencies = cfg.dependencies ?? []
  if (isString(cfg.dependencies)) cfg.dependencies = [cfg.dependencies]
  if (!this[name]) this[name] = {}
  this[name].config = cfg
}

async function buildConfig ({ argv, env }) {
  const { log, freeze } = this.bajo.helper
  log.debug('Read configurations')
  for (const pkg of this.bajo.config.plugins) {
    await runner.call(this, pkg, { argv, env })
  }
  freeze(this.bajo.config)
}

export default buildConfig
