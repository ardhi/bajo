import _ from 'lodash'
import os from 'os'
import getModuleDir from './get-module-dir.js'
import pathResolve from './path-resolve.js'
import readJson from './read-json.js'

async function getPkg (...pkg) {
  const result = {}
  for (const p of pkg) {
    const parts = _.map(p.split(':'), i => _.trim(i))
    let [orgName, name, ns] = parts
    if (parts.length === 1) name = orgName
    if (_.isEmpty(name)) name = orgName
    const dir = getModuleDir.handler(orgName, ns)
    const pkg = readJson.handler(`${dir}/package.json`)
    const mainFile = pathResolve.handler(dir, os.platform() === 'win32') + '/' + (pkg.main || _.get(pkg, 'exports.default', 'index.js'))
    const mod = await import(mainFile)
    result[name] = _.has(mod, 'default') ? mod.default : mod
  }
  if (pkg.length === 1) return result[_.keys(result)[0]]
  return result
}

export default {
  handler: getPkg,
  noScope: true
}
