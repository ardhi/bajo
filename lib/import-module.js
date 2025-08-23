import resolvePath from './resolve-path.js'
import fs from 'fs-extra'
import lodash from 'lodash'
const { isFunction, isPlainObject } = lodash

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
