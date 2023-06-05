const fastGlob = require('fast-glob')
const _ = require('lodash')
const pathResolve = require('../helper/path-resolve')

const wrapFn = function (name, handler, bind) {
  return (...args) => {
    const stack = (new Error().stack.split("at ")[2]).trim()
    const line = stack.match(/\(([^()]*)\)/)[1]
    this.bajo.log.trace({ args, line }, `Call helper: %s()`, name)
    if (bind) return handler.call(this, ...args)
    return handler(...args)
  }
}

const wrapAsyncFn = function (name, handler, bind) {
  return async (...args) => {
    const stack = (new Error().stack.split("at ")[2]).trim()
    const line = stack.match(/\(([^()]*)\)/)[1]
    this.bajo.log.trace({ args, line }, `Call helper: %s()`, name)
    if (bind) return await handler.call(this, ...args)
    return await handler(...args)
  }
}

module.exports = async function (dir, { pkg = 'bajo', exclude = [] } = {}) {
  dir = pathResolve.handler(dir)
  exclude = _.map(exclude, e => `${dir}/${e}`)
  let files = await fastGlob(`${dir}/**/*.js`)
  files = _.without(files, ...exclude)
  const helper = {}
  const me = this
  _.each(files, f => {
    const base = f.replace(dir, '').replace('.js', '')
    const name = _.camelCase(base)
    const fnName = pkg + '.' + name
    let mod = require(f)
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
  })
  return helper
}
