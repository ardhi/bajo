import getGlobalPath from 'get-global-path'
import resolvePath from './resolve-path.js'
import lodash from 'lodash'
import fs from 'fs-extra'

const { dropRight } = lodash

function getGlobalModuleDir (pkgName, silent = true) {
  let nodeModulesDir = process.env.BAJO_GLOBAL_MODULE_DIR
  if (!nodeModulesDir) {
    const npmPath = getGlobalPath('npm')
    if (!npmPath) {
      if (silent) return
      throw this.error('cantLocateNpmGlobalDir', { code: 'BAJO_CANT_LOCATE_NPM_GLOBAL_DIR' })
    }
    nodeModulesDir = dropRight(resolvePath(npmPath).split('/'), 1).join('/')
    process.env.BAJO_GLOBAL_MODULE_DIR = nodeModulesDir
  }
  if (!pkgName) return nodeModulesDir
  const dir = `${nodeModulesDir}/${pkgName}`
  if (!fs.existsSync(dir)) {
    if (silent) return
    throw this.error('cantLocateGlobalDir%s', pkgName, { code: 'BAJO_CANT_LOCATE_MODULE_GLOBAL_DIR' })
  }
  return dir
}

export default getGlobalModuleDir
