module.exports = function (name) {
  const { _ } = this.bajo.helper
  if (name === 'bajo' || _.isEmpty(name)) return this.bajo.config
  if (this[name] && _.isPlainObject(this[name].config) && this[name].config.name === name) return this[name].config
  return {}
}
