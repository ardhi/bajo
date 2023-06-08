const path = require('path')
const pathResolve = require('./path-resolve')

module.exports = {
  handler: function (name) {
    if (name === 'app') return pathResolve.handler(process.cwd())
    const pkgPath = name + '/package.json'
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
