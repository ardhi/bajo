import { isFunction, isPlainObject, map, camelCase } from 'lodash-es'

async function collectConfigHandlers () {
  const { getModuleDir, importModule, join } = this.bajo.helper
  for (const pkg of this.bajo.config.plugins) {
    let dir
    try {
      dir = getModuleDir(pkg)
    } catch (err) {}
    if (!dir) continue
    const file = `${dir}/bajo/extend/read-config.js`
    let mod = await importModule(file)
    if (!mod) continue
    const scope = this[camelCase(pkg)]
    if (isFunction(mod)) mod = await mod.call(scope)
    if (isPlainObject(mod)) mod = [mod]
    this.bajo.configHandlers.concat(mod)
  }
  const exts = map(this.bajo.configHandlers, 'ext')
  this.bajo.log.trace('Config handlers: %s', join(exts))
}

export default collectConfigHandlers
