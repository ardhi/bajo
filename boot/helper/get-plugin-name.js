import { isString, isNumber, each, camelCase } from 'lodash-es'
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
  if (isString(fname)) file = fname
  else file = callsites()[isNumber(fname) ? fname : 2].getFileName()
  if (!file) throw error('Can\'t resolve bajo named \'%s\', sorry!', fname, { code: 'BAJO_UNABLE_TO_RESOLVE_BAJO_NAME' })
  file = pathResolve(file)
  let match
  each(config.plugins, b => {
    if (file.includes('/bajo/boot/')) {
      match = 'bajo'
      return false
    }
    if (file.includes(b)) {
      match = b
      return false
    }
  })
  if (match) return camelCase(match)
  return 'bajo'
}

export default getPluginName
