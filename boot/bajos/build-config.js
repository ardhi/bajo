const omitKeys = ['name', 'dir', 'module', 'alias', 'pkg', 'plugin', 'init', 'dependency', 'single', 'level']

module.exports = async function (pkg, { names, singles, c }) {
  const { _, fs, getConfig, getModuleDir, readConfig, isSet, lockfile, error } = this.bajo.helper
  const config = getConfig()
  const dir = pkg === 'app' ? (config.dir.base + '/app') : getModuleDir(pkg)
  if (pkg !== 'app' && !fs.existsSync(`${dir}/bajo`)) throw error(`Package ${pkg} isn\'t a valid Bajo package`, { code: 'BAJO_INVALID_PACKAGE' })
  const name = _.camelCase(pkg)
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
  cfg.pkg = _.pick(require(`${dir + (pkg === 'app' ? '/..' : '')}/package.json`),
    ['name', 'version', 'description', 'author', 'license', 'homepage'])
  if (cfg.name === 'app') {
    cfg.prefix = ''
    cfg.alias = 'app'
  } else {
    if (!isSet(cfg.alias)) cfg.alias = pkg.slice(0, 5) === 'bajo-' ? pkg.slice(5).toLowerCase() : pkg // fix. can't be overriden
    if (!isSet(cfg.prefix)) cfg.prefix = _.kebabCase(cfg.alias)
  }
  if (cfg.prefix[0] === '/') cfg.prefix = cfg.prefix.slice(1)
  // merge with config from datadir
  try {
    const altCfg = await readConfig(`${config.dir.data}/config/${cfg.name}.*`)
    cfg = _.defaultsDeep(_.omit(altCfg, omitKeys), cfg)
  } catch (err) {}
  // merge with args & process.env
  _.each(_.keys(c), i => {
    if (c[i][cfg.name]) cfg = _.defaultsDeep(_.omit(c[i][cfg.name], omitKeys), cfg)
  })
  cfg.dependency = cfg.dependency || []
  if (_.isString(cfg.dependency)) cfg.dependency = [cfg.dependency]
  names.push(name)
  if (cfg.single) {
    const lockfilePath = `${config.dir.lock}/${name}.lock`
    const file = `${cfg.dir}/package.json`
    try {
      await lockfile.lock(file, { lockfilePath })
    } catch (err) {
      singles.push(pkg)
    }
  }
  this[name].config = cfg
  this.bajo.event.emit('boot', [`${name}ReadConfig`, `Read configuration: %s`, 'debug', name])
}
