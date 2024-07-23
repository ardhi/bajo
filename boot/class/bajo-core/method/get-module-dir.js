import path from 'path'
import fs from 'fs-extra'
import getGlobalModuleDir from './get-global-module-dir.js'
import resolvePath from './resolve-path.js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

function findDeep (item, paths) {
  let dir
  for (const p of paths) {
    const d = `${p}/${item}`
    if (fs.existsSync(d)) {
      dir = d
      break
    }
  }
  return dir
}

function getModuleDir (pkgName, base) {
  if (pkgName === 'main') return resolvePath(process.env.BAJOCWD)
  if (base === 'main') base = process.env.BAJOCWD
  else if (this && this.app && this.app[base]) base = this.app[base].pkgName
  const pkgPath = pkgName + '/package.json'
  const paths = require.resolve.paths(pkgPath)
  const gdir = getGlobalModuleDir()
  paths.unshift(gdir)
  paths.unshift(resolvePath(path.join(process.env.BAJOCWD, 'node_modules')))
  let dir = findDeep(pkgPath, paths)
  if (base && !dir) dir = findDeep(`${base}/node_modules/${pkgPath}`, paths)
  if (!dir) return null
  return resolvePath(path.dirname(dir))
}

export default getModuleDir
