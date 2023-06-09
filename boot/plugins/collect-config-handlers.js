import _ from 'lodash'
import fs from 'fs-extra'

async function collectConfigHandlers (pkg) {
  const { getModuleDir, importModule, log } = this.bajo.helper
  for (const pkg of this.bajo.config.plugins) {
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
      if (_.isPlainObject(mod)) mod = [mod]
      this.bajo.configHandlers.concat(mod)
    } catch (err) {}
  }
  const exts = _.map(this.bajo.configHandlers, 'ext')
  log.trace('Config handlers: %s', exts.join(', '))
}

export default collectConfigHandlers