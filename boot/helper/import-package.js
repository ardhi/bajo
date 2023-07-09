import _ from 'lodash'
import os from 'os'
import getModuleDir from './get-module-dir.js'
import pathResolve from './path-resolve.js'
import readJson from './read-json.js'
import defaultsDeep from './defaults-deep.js'

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
 * const imported = await importPackage('ora::bajo-cli')
 * const multiple = await importPackage('ora::bajo-cli', 'lodash:_:bajo')
 *
 * @param  {...string} pkg
 * @returns
 */

const importPackage = async (...pkg) => {
  const result = {}
  let opts = { returnDefault: true }
  if (_.isPlainObject(_.last(pkg))) {
    opts = defaultsDeep(pkg.pop(), opts)
  }
  for (const p of pkg) {
    const parts = _.map(p.split(':'), i => _.trim(i))
    let [orgName, name, ns] = parts
    if (parts.length === 1) name = orgName
    if (_.isEmpty(name)) name = orgName
    const dir = getModuleDir(orgName, ns)
    const pkg = readJson(`${dir}/package.json`)
    const mainFile = pathResolve(dir, os.platform() === 'win32') + '/' + (pkg.main || _.get(pkg, 'exports.default', 'index.js'))
    let mod = await import(mainFile)
    if (opts.returnDefault && _.has(mod, 'default')) {
      mod = mod.default
      if (opts.returnDefault && _.has(mod, 'default')) mod = mod.default
    }
    result[name] = mod
  }
  if (pkg.length === 1) return result[_.keys(result)[0]]
  if (opts.asObject) return result
  return _.values(result)
}

export default importPackage
