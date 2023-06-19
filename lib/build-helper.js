import fastGlob from 'fast-glob'
import _ from 'lodash'
import pathResolve from '../helper/path-resolve.js'
import importModule from '../helper/import-module.js'

function stackInfo (name, ...args) {
  const { log, callsites } = this.bajo.helper
  const config = this.bajo.config
  if (config.env === 'prod') return
  if (config.log.details.includes('helper')) {
    const line = callsites()[2].getFileName()
    log.trace({ args, line }, `Call helper: %s() - %s`, name)
  } else log.trace(`Call helper: %s()`, name)
}

const wrapFn = function (name, handler, bind) {
  return (...args) => {
    stackInfo.call(this, name, ...args)
    if (bind) return handler.call(this, ...args)
    return handler(...args)
  }
}

const wrapAsyncFn = function (name, handler, bind) {
  return async (...args) => {
    // stackInfo.call(this, name, ...args)
    if (bind) return await handler.call(this, ...args)
    return await handler(...args)
  }
}

export default async function (dir, { pkg = 'bajo', exclude = [] } = {}) {
  dir = pathResolve.handler(dir)
  exclude = _.map(exclude, e => `${dir}/${e}`)
  let files = await fastGlob(`${dir}/**/*.js`)
  files = _.without(files, ...exclude)
  const helper = {}
  const me = this
  for (const f of files) {
    const base = f.replace(dir, '').replace('.js', '')
    const name = _.camelCase(base)
    const fnName = pkg + '.' + name
    let mod = await importModule.handler(f)
    if (_.isFunction(mod)) {
      if (mod.constructor.name === 'AsyncFunction') mod = wrapAsyncFn.call(this, fnName, mod, true)
      else mod = wrapFn.call(this, fnName, mod, true)
    } else if (_.isPlainObject(mod)) {
      if (_.isFunction(mod.handler)) {
        const fn = mod.handler
        if (mod.noScope) {
          if (fn.constructor.name === 'AsyncFunction') mod = wrapAsyncFn.call(this, fnName, fn, false)
          else mod = wrapFn.call(this, fnName, fn, false)
        } else {
          if (fn.constructor.name === 'AsyncFunction') mod = wrapAsyncFn.call(this, fnName, fn, true)
          else mod = wrapFn.call(this, fnName, fn, true)
        }
        // mod = mod.noScope ? mod.handler : mod.handler.bind(this)
      } else if (_.isFunction(mod.class)) mod = new mod.class(this)
    }
    helper[name] = mod
  }
  return helper
}
