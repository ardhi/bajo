import { camelCase, isString, omit } from 'lodash-es'
import fastGlob from 'fast-glob'
import path from 'path'
import omittedPluginKeys from '../../lib/omitted-plugin-keys.js'

async function eachPlugins (handler, options = {}) {
  if (typeof options === 'string') options = { glob: options }
  const result = {}
  const plugins = [...this.app.bajo.config.plugins]
  const { glob, useBajo, baseNs = '' } = options
  if (useBajo) plugins.unshift('bajo')
  for (const pkg of plugins) {
    const ns = camelCase(pkg)
    const scope = this.app[ns]
    let cfg = scope.config
    const { alias, dependencies } = cfg
    const dir = cfg.dir.pkg
    cfg = omit(cfg, omittedPluginKeys)
    let r
    if (glob) {
      const base = `${dir}${baseNs}`
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
        const resp = await handler.call(scope, { ns, pkg, cfg, alias, file: f, dir: base, dependencies })
        if (resp === false) break
        else if (resp === undefined) continue
        else {
          result[ns] = result[ns] ?? {}
          result[ns][f] = resp
        }
      }
    } else {
      r = await handler.call(scope, { ns, pkg, cfg, dir, alias, dependencies })
      if (r === false) break
      else if (r === undefined) continue
      else result[ns] = r
    }
  }
  return result
}

export default eachPlugins
