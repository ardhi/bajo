import _ from 'lodash'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'

function getConfig (name, { full, clone } = {}) {
  if (name === 'bajo' || _.isEmpty(name)) return this.bajo.config
  if (this[name] && _.isPlainObject(this[name].config) && this[name].config.name === name) {
    const cfg = clone ? _.cloneDeep(this[name].config) : this[name].config
    return full ? cfg : _.omit(cfg, omittedPluginKeys)
  }
  const ref = _.find(this.bajo.pluginRefs || [], { alias: name })
  if (ref) {
    const cfg = clone ? _.cloneDeep(this[ref.name].config) : this[ref.name].config
    return full ? cfg : _.omit(cfg, omittedPluginKeys)
  }
  return {}
}

export default getConfig
