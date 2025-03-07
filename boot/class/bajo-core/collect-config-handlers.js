import lodash from 'lodash'
const { isFunction, isPlainObject, camelCase } = lodash

async function collectConfigHandlers () {
  for (const pkg of this.pluginPkgs) {
    let dir
    try {
      dir = this.getModuleDir(pkg)
    } catch (err) {}
    if (!dir) continue
    const file = `${dir}/bajo/config-handlers.js`
    let mod = await this.importModule(file)
    if (!mod) continue
    if (isFunction(mod)) mod = await mod.call(this.app[camelCase(pkg)])
    if (isPlainObject(mod)) mod = [mod]
    this.configHandlers = this.configHandlers.concat(mod)
  }
}

export default collectConfigHandlers
