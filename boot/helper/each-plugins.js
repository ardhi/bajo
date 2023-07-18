import { camelCase, isString, omit } from 'lodash-es'
import fastGlob from 'fast-glob'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'

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
 * @param {string} argument.pkgName - Bajo's package name
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

async function eachPlugins (handler, { key = 'name', glob, ns } = {}) {
  const { getConfig, getPluginName } = this.bajo.helper
  const config = getConfig()
  const result = {}
  ns = ns || getPluginName(4)
  for (const pkgName of config.plugins) {
    const name = camelCase(pkgName)
    let cfg = getConfig(name, { full: true })
    const { alias, dir, dependencies } = cfg
    cfg = omit(cfg, omittedPluginKeys)
    let r
    if (glob) {
      if (isString(glob)) glob = { pattern: glob }
      const base = `${dir}/${ns}`
      const files = await fastGlob(`${base}/${glob.pattern}`, glob.options)
      for (const f of files) {
        const resp = await handler.call(this, { name, pkgName, cfg, alias, file: f, dir: base, dependencies })
        if (resp === false) break
        else if (resp === undefined) continue
        else {
          result[name] = result[name] || {}
          result[name][f] = resp
        }
      }
    } else {
      r = await handler.call(this, { name, pkgName, cfg, dir, alias, dependencies })
      if (r === false) break
      else if (r === undefined) continue
      else result[name] = r
    }
  }
  return result
}

export default eachPlugins
