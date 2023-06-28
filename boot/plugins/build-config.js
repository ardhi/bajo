const omitKeys = ['name', 'dir', 'module', 'alias', 'pkg', 'plugin', 'init', 'dependency', 'single', 'level']

async function runner (pkg, { singles, argv, env }) {
  const { _, fs, log, getConfig, getModuleDir, readConfig, isSet, lockfile, error, readJson, defaultsDeep } = this.bajo.helper
  const config = getConfig()
  const name = _.camelCase(pkg)
  log.trace(`Read configuration: %s`, name)
  const dir = pkg === 'app' ? (config.dir.base + '/app') : getModuleDir(pkg)
  if (pkg !== 'app' && !fs.existsSync(`${dir}/bajo`)) throw error(`Package ${pkg} isn\'t a valid Bajo package`, { code: 'BAJO_INVALID_PACKAGE' })
  let cfg = { name }
  try {
    cfg = await readConfig(`${dir}/bajo/config-${config.env}.*`)
    cfg.name = name
  } catch (err) {
    if (['BAJO_CONFIG_NO_PARSER'].includes(err.code)) throw err
    if (['BAJO_CONFIG_FILE_NOT_FOUND'].includes(err.code)) {
      try {
        cfg = await readConfig(`${dir}/bajo/config.*`)
        cfg.name = name
      } catch (err) {
        if (!['BAJO_CONFIG_FILE_NOT_FOUND'].includes(err.code)) throw err
      }
    }
  }
  cfg.dir = dir
  const pkgJson = await readJson(`${dir + (pkg === 'app' ? '/..' : '')}/package.json`)
  cfg.pkg = _.pick(pkgJson,
    ['name', 'version', 'description', 'author', 'license', 'homepage'])
  if (cfg.name === 'app') cfg.alias = 'app'
  else if (!isSet(cfg.alias)) cfg.alias = pkg.slice(0, 5) === 'bajo-' ? pkg.slice(5).toLowerCase() : pkg // fix. can't be overriden
  // merge with config from datadir
  try {
    const altCfg = await readConfig(`${config.dir.data}/config/${cfg.name}.*`)
    cfg = defaultsDeep({}, _.omit(altCfg, omitKeys), cfg)
  } catch (err) {}
  const envArgv = defaultsDeep({}, _.omit(env[cfg.name] || {}, omitKeys) || {}, _.omit(argv[cfg.name] || {}, omitKeys) || {})
  cfg = defaultsDeep({}, envArgv || {}, cfg || {})
  cfg.dependency = cfg.dependency || []
  if (_.isString(cfg.dependency)) cfg.dependency = [cfg.dependency]
  if (cfg.single) {
    const lockfileDir = `${config.dir.tmp}/lock`
    const lockfilePath = `${lockfileDir}/${name}.lock`
    fs.ensureDirSync(lockfileDir)
    const file = `${cfg.dir}/package.json`
    try {
      await lockfile.lock(file, { lockfilePath })
    } catch (err) {
      singles.push(pkg)
    }
  }
  if (!this[name]) this[name] = {}
  this[name].config = cfg
}

export default async function ({ singles, argv, env }) {
  const { _, log, freeze } = this.bajo.helper
  log.debug('Read configurations')
  for (const pkg of this.bajo.config.plugins) {
    await runner.call(this, pkg, { singles, argv, env })
  }
  _.pull(this.bajo.config.plugins, ...singles)
  _.each(singles, s => delete this[_.camelCase(s)])
  freeze(this.bajo.config)
}