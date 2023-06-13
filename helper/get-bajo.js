const _ = require('lodash')
const callsites = require('callsites')
const error = require('./error').handler
const pathResolve = require('./path-resolve').handler

/**
 * Get the right Bajo name inside your app or plugins/Bajos. If parameter ```fname```
 * is not provided, it will be set to the actual file this function is called.
 *
 * @memberof helper
 * @instance
 * @param {string} [fname] - File name (relative/absolute)
 * @throws Will throw if Bajo name coldn't be resolved
 * @returns {string} Bajo name
 */

function getBajo (fname) {
  const config = this.bajo.config
  let file
  if (fname) file = fname
  else file = callsites()[2].getFileName()
  if (!file) throw error('Can\'t resolve bajo name, sorry!', { code: 'BAJO_UNABLE_TO_RESOLVE_BAJO_NAME' })
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
}

module.exports = {
  handler: getBajo,
  noScope: false
}
