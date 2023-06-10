module.exports = function () {
  const { _, getConfig } = this.bajo.helper
  const config = getConfig()
  const c = { env: {}, arg: {} }
  _.each(_.keys(c), i => {
    const items = c === 'env' ? process.env : config.argv
    const splitter = c === 'env' ? '__' : '--'
    const ksplitter = c === 'env' ? '_' : '-'
    _.forOwn(items, (v, k) => {
      let [ns, key] = k.split(splitter)
      if (!key) return
      ns = _.camelCase(ns)
      if (!c[i][ns]) c[i][ns] = {}
      _.set(c[i][ns], key.replaceAll(ksplitter, '.'), v)
    })
  })
  return c
}