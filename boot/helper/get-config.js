import _ from 'lodash'

function getConfig (name) {
  if (name === 'bajo' || _.isEmpty(name)) return this.bajo.config
  if (this[name] && _.isPlainObject(this[name].config) && this[name].config.name === name) return this[name].config
  return {}
}

export default getConfig
