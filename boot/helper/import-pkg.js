import { isPlainObject, map, last, isEmpty, has, keys, values, trim, get } from 'lodash-es'
import os from 'os'
import getModuleDir from './get-module-dir.js'
import resolvePath from './resolve-path.js'
import readJson from './read-json.js'
import defaultsDeep from './defaults-deep.js'
import path from 'path'
import fs from 'fs-extra'

/**
 * Load/import a package dynamically. You can import package one-by-one or multiple
 * packages at once.
 *
 * Package 'pkg' must be in the following format: ```<original name>:<new name>:<bajo package name>```
 * ```<new name>``` can be omitted, so the format will be: ```<name>::<bajo package name>```
 *
 * If you only import one package, returned value is the imported package itself
 * If multiple packages are imported, returned value is an object with ```<new name>``` as its
 * keys and imported packages as its values
 *
 * Example:
 * ```
 * const imported = await importPkg('ora::bajo-cli')
 * const multiple = await importPkg('ora::bajo-cli', 'lodash:_:bajo')
 *
 * @param  {...string} pkg
 * @returns
 */

const importPkg = async (...pkg) => {
  const result = {}
  let opts = { returnDefault: true }
  if (isPlainObject(last(pkg))) {
    opts = defaultsDeep(pkg.pop(), opts)
  }
  for (const p of pkg) {
    const parts = map(p.split(':'), i => trim(i))
    let [ns, orgName, name] = parts
    if (parts.length === 1) {
      orgName = ns
      ns = 'bajo'
      name = orgName
    } else if (parts.length === 2) {
      name = orgName
    }
    if (isEmpty(name)) name = orgName
    const dir = getModuleDir(orgName, ns)
    const pkg = readJson(`${dir}/package.json`)
    const mainFileOrg = dir + '/' + (pkg.main || get(pkg, 'exports.default', 'index.js'))
    let mainFile = resolvePath(mainFileOrg, os.platform() === 'win32')
    if (isEmpty(path.extname(mainFile))) {
      if (fs.existsSync(`${mainFileOrg}/index.js`)) mainFile += '/index.js'
      else mainFile += '.js'
    }
    let mod = await import(mainFile)
    if (opts.returnDefault && has(mod, 'default')) {
      mod = mod.default
      if (opts.returnDefault && has(mod, 'default')) mod = mod.default
    }
    result[name] = mod
  }
  if (pkg.length === 1) return result[keys(result)[0]]
  if (opts.asObject) return result
  return values(result)
}

export default importPkg
