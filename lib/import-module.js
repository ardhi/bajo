import fs from 'fs-extra'
import lodash from 'lodash'
import aneka from 'aneka'

const { resolvePath } = aneka
const { isFunction, isPlainObject } = lodash

/**
 * Import file/module from any loaded plugins
 *
 * Example: your plugin structure looks like this
 * ```
 * |- src
 * |  |- lib
 * |  |  |- my-module.js
 * |- index.js
 * |- package.json
 * ```
 *
 * And now this is how to import ```my-module.js```:
 * ```javascript
 * const { importModule } = this.app.bajo
 * const myModule = await importModule('myPlugin:/src/lib/my-module.js')
 * ```
 *
 * @method
 * @async
 * @memberof module:Lib
 * @param {TNsPathPairs} file - File to import
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.asDefaultImport=true] - If ```true``` (default), return default imported module
 * @param {boolean} [options.asHandler] - If ```true```, return as a {@link HandlerType|handler}
 * @param {boolean} [options.noCache] - If ```true```, always import as a fresh copy
 * @returns {any}
 * @see Bajo#importModule
 */
async function importModule (file, { asDefaultImport, asHandler, noCache } = {}) {
  const load = async (file, asDefaultImport = true, noCache = false) => {
    file = resolvePath(file, true)
    if (noCache) file += `?_=${Date.now()}`
    const imported = await import(file)
    if (asDefaultImport) return imported.default
    return imported
  }

  if (this) file = this.getPluginFile(file)
  if (!fs.existsSync(file)) return
  let mod = await load(file, asDefaultImport, noCache)
  if (!asHandler) return mod
  if (isFunction(mod)) mod = { level: 999, handler: mod }
  if (!isPlainObject(mod)) {
    if (this) throw this.error('fileNotModuleHandler%s', file)
    throw new Error(`File '${file}' is NOT a handler module`)
  }
  return mod
}

export default importModule
