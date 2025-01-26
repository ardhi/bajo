import lodash from 'lodash'
import os from 'os'
import getModuleDir from './get-module-dir.js'
import resolvePath from './resolve-path.js'
import readJson from './read-json.js'
import defaultsDeep from './defaults-deep.js'
import breakNsPath from './break-ns-path.js'
import path from 'path'
import fs from 'fs-extra'

const { isPlainObject, last, isEmpty, has, keys, values, get } = lodash

async function importPkg (...pkgs) {
  const result = {}
  const notFound = []
  let opts = { returnDefault: true, thrownNotFound: false }
  if (isPlainObject(last(pkgs))) {
    opts = defaultsDeep(pkgs.pop(), opts)
  }
  for (const pkg of pkgs) {
    const { ns, path: name } = breakNsPath.call(this, pkg)
    const dir = getModuleDir.call(this, name, ns)
    if (!dir) {
      notFound.push(pkg)
      continue
    }
    const p = readJson(`${dir}/package.json`, opts.thrownNotFound)
    const mainFileOrg = dir + '/' + (p.main ?? get(p, 'exports.default', 'index.js'))
    let mainFile = resolvePath(mainFileOrg, os.platform() === 'win32')
    if (isEmpty(path.extname(mainFile))) {
      if (fs.existsSync(`${mainFileOrg}/index.js`)) mainFile += '/index.js'
      else mainFile += '.js'
    }
    if (opts.noCache) mainFile += `?_=${Date.now()}`
    let mod = await import(mainFile)
    if (opts.returnDefault && has(mod, 'default')) {
      mod = mod.default
      if (opts.returnDefault && has(mod, 'default')) mod = mod.default
    }
    result[name] = mod
  }
  if (notFound.length > 0) throw this.error('Can\'t find %s', this.join(notFound))
  if (pkgs.length === 1) return result[keys(result)[0]]
  if (opts.asObject) return result
  return values(result)
}

export default importPkg
