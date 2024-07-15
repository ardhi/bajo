import resolvePath from './resolve-path.js'
import getPluginFile from './get-plugin-file.js'
import { isFunction, isPlainObject } from 'lodash-es'
import fs from 'fs-extra'

async function load (file, asDefaultImport = true, noCache = true) {
  file = resolvePath(file, true)
  if (noCache) file += `?_=${Date.now()}`
  const imported = await import(file)
  if (asDefaultImport) return imported.default
  return imported
}

async function importModule (file, { asDefaultImport, asHandler, noCache } = {}) {
  const me = this
  file = getPluginFile.call(me, file)
  if (!fs.existsSync(file)) return
  let mod = await load(file, asDefaultImport, noCache)
  if (!asHandler) return mod
  if (isFunction(mod)) mod = { level: 999, handler: mod }
  if (!isPlainObject(mod)) throw this.error.call(me.app, 'File \'%s\' is NOT a handler module', file)
  return mod
}

export default importModule
