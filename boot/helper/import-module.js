import pathResolve from './path-resolve.js'
import _ from 'lodash'
import error from './error.js'

async function load (file, asDefaultImport = true) {
  const imported = await import(pathResolve.handler(file, true))
  if (asDefaultImport) return imported.default
  return imported
}

async function importModule (file, { asDefaultImport, forCollector } = {}) {
  let mod = await load(file, asDefaultImport)
  if (!forCollector) return mod
  if (_.isFunction(mod)) mod = { level: 999, handler: mod }
  if (!_.isPlainObject(mod)) throw error(`File '%s' is NOT a module for collector`, file, { code: 'BAJO_INVALID_MODULE_FOR_COLLECTOR' })
  if (mod.handler.constructor.name !== 'AsyncFunction') {
    const oldHandler = mod.handler
    mod.handler = async function (...args) {
      oldHandler.call(this, ...args)
    }
  }
  return mod
}

export default importModule
