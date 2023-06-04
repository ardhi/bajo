module.exports = async function (handler, store = {}, { key = 'name' } = {}) {
  const { getConfig } = this.bajo.helper
  const config = getConfig()
  const result = {}
  for (const n of config.bajos) {
    const cfg = getConfig(n)
    const r = await handler.call(this, n, store)
    if (r === false) break
    else if (r === undefined) continue
    else result[cfg[key]] = r
  }
  return result
}
