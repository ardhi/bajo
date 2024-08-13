import { camelCase, isString, omit, cloneDeep } from 'lodash-es'
import fastGlob from 'fast-glob'
import path from 'path'

async function eachPlugins (handler, options = {}) {
  if (typeof options === 'string') options = { glob: options }
  const result = {}
  const pluginPkgs = cloneDeep(this.app.bajo.pluginPkgs) ?? []
  const { glob, useBajo, prefix = '', returnItems } = options
  if (useBajo) pluginPkgs.unshift('bajo')
  for (const pkgName of pluginPkgs) {
    const ns = camelCase(pkgName)
    const config = this.app[ns].config
    const alias = this.app[ns].alias
    let r
    if (glob) {
      const base = prefix === '' ? this.app[ns].dir.pkg : `${this.app[ns].dir.pkg}/${prefix}`
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
        const resp = await handler.call(this.app[ns], { ns, pkgName, config, alias, file: f, dir: base })
        if (resp === false) break
        else if (resp === undefined) continue
        else {
          result[ns] = result[ns] ?? {}
          result[ns][f] = resp
        }
      }
    } else {
      r = await handler.call(this.app[ns], { ns, pkgName, config, dir: this.app[ns].dir.pkg, alias })
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
