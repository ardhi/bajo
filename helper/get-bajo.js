const _ = require('lodash')
const callsites = require('callsites')
const error = require('./error').handler
const pathResolve = require('./path-resolve').handler

module.exports = {
  handler: function (fname) {
    const config = this.bajo.config
    let file
    if (fname) file = fname
    else file = callsites()[2].getFileName()
    if (!file) throw error('Can\'t find bajo name, sorry!', { code: 'BAJO_UNABLE_TO_FIND_BAJO' })
    file = pathResolve(file)
    let match
    _.each(config.bajos, b => {
      if (file.includes(b)) {
        match = b
        return false
      }
    })
    if (match) return _.camelCase(match)
    if (!match && file.includes(pathResolve(process.cwd()))) return 'app'
    return 'bajo'
  },
  noScope: false
}
