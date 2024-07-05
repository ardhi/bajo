import { camelCase, isString, omit, trim } from 'lodash-es'
import fastGlob from 'fast-glob'
import path from 'path'
import omittedPluginKeys from '../../lib/omitted-plugin-keys.js'

async function _eachPlugins (handler, { key = 'name', glob, ns, useBajo } = {}) {
  const result = {}
  const plugins = [...this.app.bajo.config.plugins]
  if (useBajo) plugins.unshift('bajo')
  for (const pkg of plugins) {
    const plugin = camelCase(pkg)
    let cfg = this.app[plugin].config
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
        if (!path.isAbsolute(pattern[i])) pattern[i] = `${base}/${pattern[i]}`
      }
      const files = await fastGlob(pattern, opts)
      for (const f of files) {
        if (path.basename(f)[0] === '_') continue
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

async function eachPlugins (handler, options = {}) {
  if (typeof options === 'string') options = { glob: options }
  let { key = 'name', glob, ns, extend, extendHandler, useBajo } = options
  if (!extendHandler) extendHandler = handler
  ns = ns ?? this.name
  const result = await _eachPlugins.call(this, handler, { key, glob, ns, useBajo })
  if (extend && isString(glob)) {
    let nsExtend = ns
    if (isString(extend)) nsExtend += '/' + trim(extend, '/')
    const cfg = this.app.main.config
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
