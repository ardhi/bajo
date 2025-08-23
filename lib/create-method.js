import fastGlob from 'fast-glob'
import path from 'path'
import lodash from 'lodash'
import resolvePath from './resolve-path.js'

const { camelCase, isFunction } = lodash

/**
 * @module
 */

/**
 * This function scan directory for ```.js``` and ```.json``` files, read its content, and
 * turn it to become a class method by attach it to its scope (its class instance) dynamically.
 *
 * File path is camel-cased and become the method name. File that starts with underscore (eg: ```_my-file.js```)
 * is ignored; usefull to use such file as your shared library.
 *
 * @async
 * @param {string} dir - Directory to scan
 * @returns {number} Number of files found
 */
async function createMethod (dir) {
  dir = resolvePath(dir)
  const files = await fastGlob([`!${dir}/**/_*.{js,json}`, `${dir}/**/*.{js,json}`])
  for (const f of files) {
    const ext = path.extname(f)
    const base = f.replace(dir, '').slice(0, -ext.length)
    const name = camelCase(base)
    let mod
    if (ext === '.json') mod = this.app.bajo.readJson(f)
    else mod = await this.app.bajo.importModule(f)
    if (isFunction(mod)) mod = mod.bind(this)
    this[name] = mod
  }
  return files.length
}

export default createMethod
