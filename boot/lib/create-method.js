import fastGlob from 'fast-glob'
import path from 'path'
import { camelCase, isFunction, isPlainObject, forOwn } from 'lodash-es'
import resolvePath from '../core/method/resolve-path.js'
import importModule from '../core/method/import-module.js'
import readJson from '../core/method/read-json.js'

/*
const wrapFn = function (handler, bind) {
  return (...args) => {
    if (bind) return handler.call(this, ...args)
    return handler(...args)
  }
}

const wrapAsyncFn = function (handler, bind) {
  return async (...args) => {
    if (bind) return await handler.call(this, ...args)
    return await handler(...args)
  }
}
*/

export default async function (dir, pkg = 'bajo') {
  dir = resolvePath(dir)
  const files = await fastGlob([`!${dir}/**/_*.{js,json}`, `${dir}/**/*.{js,json}`])
  for (const f of files) {
    const ext = path.extname(f)
    const base = f.replace(dir, '').replace(ext, '')
    const name = camelCase(base)
    let mod
    if (ext === '.json') mod = readJson(f)
    else mod = await importModule(f)
    if (isFunction(mod)) {
      mod = mod.bind(this)
      // if (mod.constructor.name === 'AsyncFunction') mod = wrapAsyncFn.call(this, mod, true)
      // else mod = wrapFn.call(this, mod, true)
    } else if (isPlainObject(mod)) {
      if (!mod.exec) { // mod.exec offer unbind, nacked function people can bind to anything else later
        forOwn(mod, (v, k) => {
          if (isFunction(v)) mod[k] = v.bind(this)
        })
      }
    }
    this[name] = mod
  }
  return files.length
}
