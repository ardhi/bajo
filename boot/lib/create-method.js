import fastGlob from 'fast-glob'
import path from 'path'
import lodash from 'lodash'
import resolvePath from '../class/bajo-core/method/resolve-path.js'
import importModule from '../class/bajo-core/method/import-module.js'
import readJson from '../class/bajo-core/method/read-json.js'

const { camelCase, isFunction, isPlainObject, forOwn } = lodash

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
