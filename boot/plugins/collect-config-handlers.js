import { isFunction, isPlainObject, map } from 'lodash-es'

async function collectConfigHandlers (pkg) {
  const { getModuleDir, importModule, log } = this.bajo.helper
  for (const pkg of this.bajo.config.plugins) {
    let dir
    try {
      dir = getModuleDir(pkg)
    } catch (err) {}
    if (!dir) continue
    const file = `${dir}/bajo/extend/read-config.js`
    let mod = await importModule(file)
    if (!mod) continue
    if (isFunction(mod)) mod = await mod.call(this)
    if (isPlainObject(mod)) mod = [mod]
    this.bajo.configHandlers.concat(mod)
  }
  const exts = map(this.bajo.configHandlers, 'ext')
  log.trace('Config handlers: %s', exts.join(', '))
}

export default collectConfigHandlers
