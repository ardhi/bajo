import resolvePath from './resolve-path.js'
import { isFunction, isPlainObject, get } from 'lodash-es'
import error from './error.js'
import fs from 'fs-extra'

async function load (file, asDefaultImport = true, noCache = true) {
  file = resolvePath(file, true)
  if (noCache) file += `?_=${Date.now()}`
  const imported = await import(file)
  if (asDefaultImport) return imported.default
  return imported
}

async function importModule (file, { asDefaultImport, asHandler, noCache } = {}) {
  if (file.includes(':')) {
    const [plugin, path] = file.split(':')
    if (plugin.length > 1) {
      const dir = get(this[plugin], 'config.dir.pkg')
      file = `${dir}${path}`
    }
  }
  if (!fs.existsSync(file)) return
  let mod = await load(file, asDefaultImport, noCache)
  if (!asHandler) return mod
  if (isFunction(mod)) mod = { level: 999, handler: mod }
  if (!isPlainObject(mod)) throw error.call(this, 'File \'%s\' is NOT a handler module', file)
  if (mod.forceAsync && mod.handler.constructor.name !== 'AsyncFunction') {
    const oldHandler = mod.handler
    mod.handler = async function (...args) {
      oldHandler.call(this, ...args)
    }
  }
  return mod
}

export default importModule
