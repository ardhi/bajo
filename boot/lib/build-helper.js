import fastGlob from 'fast-glob'
import path from 'path'
import { camelCase, isFunction, isPlainObject, forOwn } from 'lodash-es'
import Helper from './helper.js'
import resolvePath from '../helper/resolve-path.js'
import importModule from '../helper/import-module.js'
import readJson from '../helper/read-json.js'

const wrapFn = function (name, handler, bind) {
  return (...args) => {
    if (bind) return handler.call(this, ...args)
    return handler(...args)
  }
}

const wrapAsyncFn = function (name, handler, bind) {
  return async (...args) => {
    if (bind) return await handler.call(this, ...args)
    return await handler(...args)
  }
}

export default async function (dir, pkg = 'bajo') {
  dir = resolvePath(dir)
  const files = await fastGlob([`!${dir}/**/_*.{js,json}`, `${dir}/**/*.{js,json}`])
  const helper = new Helper()
  for (const f of files) {
    const ext = path.extname(f)
    const base = f.replace(dir, '').replace(ext, '')
    const name = camelCase(base)
    const fnName = pkg + '.' + name
    let mod
    if (ext === '.json') mod = readJson(f)
    else mod = await importModule(f)
    if (isFunction(mod)) {
      if (mod.constructor.name === 'AsyncFunction') mod = wrapAsyncFn.call(this[pkg], fnName, mod, true)
      else mod = wrapFn.call(this[pkg], fnName, mod, true)
    } else if (isPlainObject(mod)) {
      if (!mod.exec) { // mod.exec offer unbind, nacked function people can band to anything else later
        forOwn(mod, (v, k) => {
          if (isFunction(v)) mod[k] = v.bind(this[pkg])
        })
      }
    }
    helper[name] = mod
  }
  return helper
}
