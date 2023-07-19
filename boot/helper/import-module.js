import pathResolve from './path-resolve.js'
import { isFunction, isPlainObject } from 'lodash-es'
import error from './error.js'

async function load (file, asDefaultImport = true) {
  const imported = await import(pathResolve(file, true))
  if (asDefaultImport) return imported.default
  return imported
}

async function importModule (file, { asDefaultImport, asHandler } = {}) {
  let mod = await load(file, asDefaultImport)
  if (!asHandler) return mod
  if (isFunction(mod)) mod = { level: 999, handler: mod }
  if (!isPlainObject(mod)) throw error('File \'%s\' is NOT a module for collection', file, { code: 'BAJO_INVALID_MODULE_FOR_COLLECTOR' })
  if (mod.handler.constructor.name !== 'AsyncFunction') {
    const oldHandler = mod.handler
    mod.handler = async function (...args) {
      oldHandler.call(this, ...args)
    }
  }
  return mod
}

export default importModule
