import { camelCase, isString, omit, isPlainObject, slice } from 'lodash-es'
import fastGlob from 'fast-glob'
import path from 'path'
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
  for (const pkg of config.plugins) {
    const plugin = camelCase(pkg)
    let cfg = getConfig(plugin, { full: true })
    const { alias, dir, dependencies } = cfg
    cfg = omit(cfg, omittedPluginKeys)
    let r
    if (glob) {
      const base = `${dir}/${ns}`
      let pattern
      let opts
      if (isPlainObject(glob) && glob.pattern) pattern = glob.pattern
      else {
        if (isString(glob)) pattern = [glob]
        for (const i in pattern) {
          pattern[i] = `${base}/${pattern[i]}`
        }
      }
      const files = await fastGlob(pattern, opts)
      for (const f of files) {
        const rel = f.replace(base, '')
        const b = path.basename(rel, path.extname(rel))
        const relDir = path.dirname(rel)
        const relDirBase = `${relDir}/${b}`
        const relName = slice(relDirBase.split('/'), 2).join('/')
        const fileInfo = {
          rel,
          relDir,
          relDirBase,
          base: b,
          name: camelCase(`${relName}`),
          nameWithPlugin: camelCase(`${plugin} ${relName}`)
        }
        const resp = await handler.call(this, { plugin, pkg, cfg, alias, file: f, dir: base, dependencies, fileInfo })
        if (resp === false) break
        else if (resp === undefined) continue
        else {
          result[plugin] = result[plugin] || {}
          result[plugin][f] = resp
        }
      }
    } else {
      r = await handler.call(this, { plugin, pkg, cfg, dir, alias, dependencies })
      if (r === false) break
      else if (r === undefined) continue
      else result[plugin] = r
    }
  }
  return result
}

export default eachPlugins
