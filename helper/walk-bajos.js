module.exports = async function (handler, { key = 'name' } = {}) {
  const { _, getConfig } = this.bajo.helper
  const config = getConfig()
  const result = {}
  for (const pkg of config.bajos) {
    const name = _.camelCase(pkg)
    const cfg = getConfig(name)
    const r = await handler.call(this, { name, pkg, cfg })
    if (r === false) break
    else if (r === undefined) continue
    else result[cfg[key]] = r
  }
  return result
}
