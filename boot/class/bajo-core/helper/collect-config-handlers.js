import getModuleDir from '../method/get-module-dir.js'
import importModule from '../method/import-module.js'
import lodash from 'lodash'
const { isFunction, isPlainObject, camelCase } = lodash

async function collectConfigHandlers () {
  for (const pkg of this.pluginPkgs) {
    let dir
    try {
      dir = getModuleDir.call(this, pkg)
    } catch (err) {}
    if (!dir) continue
    const file = `${dir}/bajo/config-handlers.js`
    let mod = await importModule.call(this, file)
    if (!mod) continue
    if (isFunction(mod)) mod = await mod.call(this.app[camelCase(pkg)])
    if (isPlainObject(mod)) mod = [mod]
    this.configHandlers = this.configHandlers.concat(mod)
  }
}

export default collectConfigHandlers
