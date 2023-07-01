import _ from 'lodash'

export default function (name) {
  if (name === 'bajo' || _.isEmpty(name)) return this.bajo.config
  if (this[name] && _.isPlainObject(this[name].config) && this[name].config.name === name) return this[name].config
  return {}
}
