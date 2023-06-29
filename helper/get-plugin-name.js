import _ from 'lodash'
import callsites from 'callsites'
import error from './error.js'
import pathResolve from './path-resolve.js'

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

function getPluginName (fname) {
  const config = this.bajo.config
  let file
  if (_.isString(fname)) file = fname
  else file = callsites()[_.isNumber(fname) ? fname : 2].getFileName()
  if (!file) throw error.handler('Can\'t resolve bajo name, sorry!', { code: 'BAJO_UNABLE_TO_RESOLVE_BAJO_NAME' })
  file = pathResolve.handler(file)
  let match
  _.each(config.plugins, b => {
    if (file.includes('/bajo/boot/')) {
      match = 'bajo'
      return false
    }
    if (file.includes(b)) {
      match = b
      return false
    }
  })
  if (match) return _.camelCase(match)
  // if (file.includes(pathResolve.handler(process.cwd()))) return 'app'
  return 'bajo'
}

export default {
  handler: getPluginName,
  noScope: false
}
