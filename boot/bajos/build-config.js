const omitKeys = ['name', 'dir', 'module', 'alias', 'pkg', 'plugin', 'init', 'dependency', 'single', 'level']

module.exports = async function (n, { names, singles, c }) {
  const { _, fs, getConfig, getModuleDir, readConfig, isSet, lockfile, error } = this.bajo.helper
  const config = getConfig()
  const dir = n === 'app' ? (config.dir.base + '/app') : getModuleDir(n)
  if (n !== 'app' && !fs.existsSync(`${dir}/bajo`)) throw error(`Package ${n} isn\'t a valid Bajo package`, { code: 'BAJO_INVALID_PACKAGE' })
  const name = _.camelCase(n)
  let cfg = { name, level: n === 'app' ? 0 : 999 }
  try {
    cfg = await readConfig(`${dir}/bajo/config.*`)
    cfg.name = name
  } catch (err) {
    if (['BAJO_CONFIG_NO_PARSER'].includes(err.code)) throw err
  }
  cfg.dir = dir
  cfg.pkg = _.pick(require(`${dir + (n === 'app' ? '/..' : '')}/package.json`),
    ['name', 'version', 'description', 'author', 'license', 'homepage'])
  if (cfg.name === 'app') {
    cfg.prefix = ''
    cfg.alias = 'app'
  } else {
    if (!isSet(cfg.alias)) cfg.alias = n.slice(0, 5) === 'bajo-' ? n.slice(5).toLowerCase() : n // fix. can't be overriden
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
  this[name].config = cfg
  names.push(name)
  if (cfg.single) {
    const lockfilePath = `${config.dir.lock}/${name}.lock`
    const file = `${cfg.dir}/package.json`
    try {
      await lockfile.lock(file, { lockfilePath })
    } catch (err) {
      singles.push(n)
    }
  }
  this.bajo.event.emit('boot', [`Read configuration: ${name}`, `${name}ReadConfig`])
}
