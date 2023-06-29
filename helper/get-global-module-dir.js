import globalModulesPath from 'global-modules-path'
import pathResolve from './path-resolve.js'
import error from './error.js'
import _ from 'lodash'

function getGlobalModuleDir (name, silent = true) {
  const npmPath = globalModulesPath.getPath('npm')
  if (!npmPath) {
    if (silent) return
    throw error.handler(`Can't locate npm global module directory`, { code: 'BAJO_CANT_LOCATE_NPM_GLOBAL_DIR' })
  }
  const nodeModules = _.dropRight(pathResolve.handler(npmPath).split('/'), 1).join('/')
  if (!name) return nodeModules
  const dir = globalModulesPath.getPath(name)
  if (!dir) {
    if (silent) return
    throw error.handler(`Can't locate '%s' global module directory`, name, { code: 'BAJO_CANT_LOCATE_MODULE_GLOBAL_DIR' })
  }
  return dir
}

export default {
  handler: getGlobalModuleDir,
  noScope: true
}
