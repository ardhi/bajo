import { isEmpty, isPlainObject, cloneDeep, omit, find } from 'lodash-es'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'

function getConfig (name, options = {}) {
  const { full, clone } = options
  if (name === 'bajo' || isEmpty(name)) return this.bajo.config
  if (this[name] && isPlainObject(this[name].config) && this[name].config.name === name) {
    const cfg = clone ? cloneDeep(this[name].config) : this[name].config
    return full ? cfg : omit(cfg, omittedPluginKeys)
  }
  const ref = find(this.bajo.pluginRefs ?? [], { alias: name })
  if (ref) {
    const cfg = clone ? cloneDeep(this[ref.plugin].config) : this[ref.plugin].config
    return full ? cfg : omit(cfg, omittedPluginKeys)
  }
  return {}
}

export default getConfig
