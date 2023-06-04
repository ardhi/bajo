module.exports = function (name) {
  const { _ } = this.bajo.helper
  if (name === 'bajo' || _.isEmpty(name)) return this.bajo.config
  const instanceName = _.camelCase(name)
  if (this[instanceName] && _.isPlainObject(this[instanceName].config) && this[instanceName].config.name === instanceName) return this[instanceName].config
  let found
  for (const n of this.bajo.config.bajos) {
    const instanceName = _.camelCase(n)
    const cfg = this[instanceName].config
    if (cfg.alias === name || cfg.name === instanceName) {
      found = cfg.name
      break
    }
  }
  if (found) return this[found].config
  return {}
}
