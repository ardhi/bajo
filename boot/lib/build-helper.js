import fastGlob from 'fast-glob'
import _ from 'lodash'
import pathResolve from '../helper/path-resolve.js'
import importModule from '../helper/import-module.js'

function stackInfo (name, ...args) {
  const { log, callsites } = this.bajo.helper
  const config = this.bajo.config
  if (config.env === 'prod') return
  if (!config.log.report.includes(`helper:${name}`)) return
  const info = callsites()[2]
  const file = info.getFileName()
  const line = info.getLineNumber()
  log.trace({ line, file, args }, `Call helper: %s()`, name)
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
    stackInfo.call(this, name, ...args)
    if (bind) return await handler.call(this, ...args)
    return await handler(...args)
  }
}

export default async function (dir, { pkg = 'bajo', exclude = [] } = {}) {
  dir = pathResolve(dir)
  exclude = _.map(exclude, e => `${dir}/${e}`)
  let files = await fastGlob(`${dir}/**/*.js`)
  files = _.without(files, ...exclude)
  const helper = {}
  for (const f of files) {
    const base = f.replace(dir, '').replace('.js', '')
    const name = _.camelCase(base)
    const fnName = pkg + '.' + name
    let mod = await importModule(f)
    if (_.isFunction(mod)) {
      if (mod.constructor.name === 'AsyncFunction') mod = wrapAsyncFn.call(this, fnName, mod, true)
      else mod = wrapFn.call(this, fnName, mod, true)
    } else if (_.isPlainObject(mod)) {
      if (_.isFunction(mod.class)) mod = new mod.class(this)
      else {
        _.forOwn(mod, (v, k) => {
          if (_.isFunction(v)) mod[k] = v.bind(this)
        })
      }
    }
    helper[name] = mod
  }
  return helper
}
