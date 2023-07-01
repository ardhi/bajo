import path from 'path'
import pathResolve from './path-resolve.js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

export default {
  handler: function (name, base) {
    if (name === 'app') return pathResolve.handler(process.cwd())
    let pkgPath = name + '/package.json'
    if (base) pkgPath = `${base}/node_modules/${pkgPath}`
    const paths = require.resolve.paths(pkgPath)
    paths.unshift(path.join(process.cwd(), 'node_modules', name))
    let resolved
    try {
      resolved = require.resolve(pkgPath, { paths })
    } catch (err) {
      return null
    }
    const dir = pathResolve.handler(path.dirname(resolved))
    return dir
  },
  noScope: true
}
