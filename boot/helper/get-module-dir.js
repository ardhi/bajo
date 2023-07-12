import path from 'path'
import pathResolve from './path-resolve.js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const getModuleDir = (pkgName, base) => {
  if (pkgName === 'app') return process.env.BAJOCWD
  let pkgPath = pkgName + '/package.json'
  if (base) pkgPath = `${base}/node_modules/${pkgPath}`
  const paths = require.resolve.paths(pkgPath)
  paths.unshift(path.join(process.env.BAJOCWD, 'node_modules', pkgName))
  let resolved
  try {
    resolved = require.resolve(pkgPath, { paths })
  } catch (err) {
    return null
  }
  const dir = pathResolve(path.dirname(resolved))
  return dir
}

export default getModuleDir
