import { camelCase, isString, omit } from 'lodash-es'
import fastGlob from 'fast-glob'
import path from 'path'

async function eachPlugins (handler, options = {}) {
  if (typeof options === 'string') options = { glob: options }
  const result = {}
  const plugins = this.app.bajo.getConfig('plugins', { defValue: [] })
  const { glob, useBajo, baseNs = '', returnItems } = options
  if (useBajo) plugins.unshift('bajo')
  for (const pkgName of plugins) {
    const ns = camelCase(pkgName)
    const cfg = this.app[ns].getConfig(null, { omit: [] })
    const { dependencies } = cfg
    const alias = this.app[ns].alias
    let r
    if (glob) {
      const base = baseNs === '' ? cfg.dir.pkg : `${cfg.dir.pkg}/${baseNs}`
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
        const resp = await handler.call(this.app[ns], { ns, pkgName, cfg, alias, file: f, dir: base, dependencies })
        if (resp === false) break
        else if (resp === undefined) continue
        else {
          result[ns] = result[ns] ?? {}
          result[ns][f] = resp
        }
      }
    } else {
      r = await handler.call(this.app[ns], { ns, pkgName, cfg, dir: cfg.dir.pkg, alias, dependencies })
      if (r === false) break
      else if (r === undefined) continue
      else result[ns] = r
    }
  }
  if (returnItems) {
    const data = []
    for (const r in result) {
      for (const f in result[r]) {
        data.push(result[r][f])
      }
    }
    return data
  }
  return result
}

export default eachPlugins
