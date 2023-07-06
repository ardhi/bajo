import globalModulesPath from 'global-modules-path'
import pathResolve from './path-resolve.js'
import error from './error.js'
import _ from 'lodash'
import fs from 'fs-extra'

const getGlobalModuleDir = (name, silent = true) => {
  let nodeModulesDir = process.env.BAJO_GLOBAL_MODULE_DIR
  if (!nodeModulesDir) {
    const npmPath = globalModulesPath.getPath('npm')
    if (!npmPath) {
      if (silent) return
      throw error(`Can't locate npm global module directory`, { code: 'BAJO_CANT_LOCATE_NPM_GLOBAL_DIR' })
    }
    nodeModulesDir = _.dropRight(pathResolve(npmPath).split('/'), 1).join('/')
    process.env.BAJO_GLOBAL_MODULE_DIR = nodeModulesDir
  }
  if (!name) return nodeModulesDir
  const dir = `${nodeModulesDir}/${name}`
  if (!fs.existsSync(dir)) {
    if (silent) return
    throw error(`Can't locate '%s' global module directory`, name, { code: 'BAJO_CANT_LOCATE_MODULE_GLOBAL_DIR' })
  }
  return dir
}

export default getGlobalModuleDir
