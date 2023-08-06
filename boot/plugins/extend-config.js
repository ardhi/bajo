import { isArray, each, isPlainObject, has, merge, concat } from 'lodash-es'
import { readAllConfigs } from './build-config.js'

async function extendConfig () {
  const { eachPlugins } = this.bajo.helper
  await eachPlugins(async function (opts) {
    if (!opts.cfg.mergeProps) return undefined
    await eachPlugins(async function ({ dir, plugin }) {
      const cfg = await readAllConfigs.call(this, `${dir}/${opts.plugin}/config`, opts.plugin)
      each(opts.cfg.mergeProps, p => {
        if (!has(cfg, p)) return undefined
        if (isArray(opts.cfg[p])) this[opts.plugin].config[p] = concat(opts.cfg[p], cfg[p])
        else if (isPlainObject(opts.cfg[p])) this[opts.plugin].config[p] = merge(opts.cfg[p], cfg[p])
        else this[opts.plugin].config[p] = cfg[p]
      })
    })
    delete this[opts.plugin].config.mergeProps
  })
}

export default extendConfig
