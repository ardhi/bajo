import _ from 'lodash'
import fastGlob from 'fast-glob'
import bootBajos from '../plugins/index.js'

/**
 * @module helper/eachPlugins
 */

/**
 * Callback function that will be executed while walking through all Bajos
 *
 * @callback handlerFn
 * @async
 * @param {Object} argument - Provides information about current Bajo
 * @param {string} argument.name - Bajo's name
 * @param {string} argument.pkg - Bajo's package name
 * @param {Object} argument.cfg - Bajo's config object
 * @returns {Object|boolean|undefined}
 */

/**
 * Walk through all plugins and execute the callback handler
 *
 * @instance
 * @async
 * @param {function} handlerFn - [The callback]{@link module:helper/eachPlugins~handlerFn}
 * @param {Object} [options] - Optional parameter
 * @param {string} [options.key=name] - Key of Bajo's config object that will be used as the key of returned object
 * @returns {Object} Results from callback execution through all Bajos
 *
 * @example
 * const { eachPlugins } = this.bajo.helper
 * await eachPlugins(async function ({ name }) => {
 *   console.log(name)
 * })
 */

async function eachPlugins (handler, { key = 'name', glob, insideBajo } = {}) {
  const { getConfig, getPluginName } = this.bajo.helper
  const config = getConfig()
  const result = {}
  for (const pkg of config.plugins) {
    const name = _.camelCase(pkg)
    const cfg = getConfig(name)
    let r
    if (glob) {
      if (_.isString(glob)) glob = { pattern: glob }
      const base = insideBajo ? `${cfg.dir}/bajo` : cfg.dir
      const files = await fastGlob(`${base}/${glob.pattern}`, glob.options)
      for (const f of files) {
        const resp = await handler.call(this, { name, pkg, cfg, file: f, dir: base })
        if (resp === false) break
        else if (resp === undefined) continue
        else {
          result[cfg[key]] = result[cfg[key]] || {}
          result[cfg[key]][f] = resp
        }
      }
    } else {
      r = await handler.call(this, { name, pkg, cfg })
      if (r === false) break
      else if (r === undefined) continue
      else result[cfg[key]] = r
    }
  }
  return result
}

export default eachPlugins