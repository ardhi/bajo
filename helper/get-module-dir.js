const path = require('path')
const pathResolve = require('./path-resolve')

module.exports = {
  handler: function (name) {
    name = name + '/package.json'
    const paths = require.resolve.paths(name)
    paths.unshift(path.join(process.cwd(), 'node_modules'))
    return pathResolve.handler(path.dirname(require.resolve(name, { paths })))
  },
  noScope: true
}
