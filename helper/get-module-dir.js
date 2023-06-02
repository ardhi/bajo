const path = require('path')
const pathResolve = require('./path-resolve')

module.exports = {
  handler: function (name) {
    name = name + '/package.json'
    return pathResolve.handler(path.dirname(require.resolve(pathResolve.handler(name))))
  },
  noScope: true
}
