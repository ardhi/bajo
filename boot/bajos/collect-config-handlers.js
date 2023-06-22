async function configHandlersCollector (pkg) {
  const { _, fs, getModuleDir, importModule, log } = this.bajo.helper
  for (const pkg of this.bajo.config.bajos) {
    let dir
    try {
      dir = getModuleDir(pkg)
    } catch (err) {}
    if (!dir) continue
    const file = `${dir}/bajo/extend/read-config.js`
    if (!fs.existsSync(file)) continue
    try {
      let mod = await importModule(file)
      if (_.isFunction(mod)) mod = await mod.call(this)
      if (_.isPlainObject(mod)) _.merge(this.bajo.configHandlers, mod)
    } catch (err) {}
  }
  const exts = _.keys(this.bajo.configHandlers)
  log.trace('Config handlers: %s', exts.join(', '))
}

export default configHandlersCollector