import fastGlob from 'fast-glob'
import path from 'path'
import lodash from 'lodash'
import resolvePath from './resolve-path.js'

const { camelCase, isFunction } = lodash

export default async function (dir, pkg = 'bajo') {
  dir = resolvePath(dir)
  const files = await fastGlob([`!${dir}/**/_*.{js,json}`, `${dir}/**/*.{js,json}`])
  const me = this
  for (const f of files) {
    const ext = path.extname(f)
    const base = f.replace(dir, '').replace(ext, '')
    const name = camelCase(base)
    let mod
    if (ext === '.json') mod = this.app.bajo.readJson(f)
    else mod = await this.app.bajo.importModule(f)
    if (isFunction(mod)) {
      const fn = mod.bind(this)
      if (mod.constructor.name === 'AsyncFunction') {
        mod = async (...args) => {
          await me.app.bajo.runHook(`${me.name}.${name}:beforeExec`, ...args)
          const result = await fn(...args)
          await me.app.bajo.runHook(`${me.name}.${name}:afterExec`, result, ...args)
          return result
        }
      } else mod = fn
    }
    this[name] = mod
  }
  return files.length
}
