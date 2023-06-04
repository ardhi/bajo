const dotenvParseVariables = require('dotenv-parse-variables')
const env = dotenvParseVariables(process.env)

module.exports = function () {
  const { _, getConfig } = this.bajo.helper
  const config = getConfig()
  const c = { env: {}, arg: {} }
  _.each(_.keys(c), i => {
    const items = c === 'env' ? env : config.argv
    const splitter = c === 'env' ? '__' : '--'
    _.forOwn(items, (v, k) => {
      let [ns, key] = k.split(splitter)
      if (!key) return
      ns = _.camelCase(ns)
      if (!c[i][ns]) c[i][ns] = {}
      c[i][ns][_.camelCase(key)] = v
    })
  })
  return c
}