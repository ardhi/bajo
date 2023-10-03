import { camelCase, isString, omit, trim } from 'lodash-es'
import fastGlob from 'fast-glob'
import path from 'path'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'

async function _eachPlugins (handler, { key = 'name', glob, ns, useBajo } = {}) {
  const { getConfig } = this.bajo.helper
  const config = getConfig()
  const result = {}
  const plugins = [...config.plugins]
  if (useBajo) plugins.unshift('bajo')
  for (const pkg of plugins) {
    const plugin = camelCase(pkg)
    let cfg = getConfig(plugin, { full: true })
    const { alias, dependencies } = cfg
    const dir = cfg.dir.pkg
    cfg = omit(cfg, omittedPluginKeys)
    let r
    if (glob) {
      const base = `${dir}/${ns}`
      let opts = isString(glob) ? { pattern: [glob] } : glob
      let pattern = opts.pattern ?? []
      if (isString(pattern)) pattern = [pattern]
      opts = omit(opts, ['pattern'])
      for (const i in pattern) {
        pattern[i] = `${base}/${pattern[i]}`
      }
      const files = await fastGlob(pattern, opts)
      for (const f of files) {
        const resp = await handler.call(this, { plugin, pkg, cfg, alias, file: f, dir: base, dependencies })
        if (resp === false) break
        else if (resp === undefined) continue
        else {
          result[plugin] = result[plugin] ?? {}
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

async function eachPlugins (handler, options = {}) {
  const { getConfig, getPluginName } = this.bajo.helper
  let { key = 'name', glob, ns, extend, extendHandler, useBajo } = options
  if (!extendHandler) extendHandler = handler
  ns = ns ?? getPluginName(4)
  const result = await _eachPlugins.call(this, handler, { key, glob, ns, useBajo })
  if (extend && isString(glob)) {
    let nsExtend = ns
    if (isString(extend)) nsExtend += '/' + trim(extend, '/')
    const cfg = getConfig('app', { full: true })
    const ext = `${cfg.dir.pkg}/${nsExtend}/extend/*`
    const exts = await fastGlob(ext, { onlyDirectories: true })
    for (const e of exts) {
      const plugin = path.basename(e)
      const files = await fastGlob(`${e}/${glob}`)
      for (const file of files) {
        await extendHandler.call(this, { file, plugin, dir: e })
      }
    }
  }
  return result // TODO: merge with extender
}

export default eachPlugins
