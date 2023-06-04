module.exports = function () {
  const { _, fs, getConfig, getModuleDir, error } = this.bajo.helper
  const config = getConfig()
  const order = _.reduce(config.bajos, (o, n, i) => {
    o[n] = 900 + i
    return o
  }, {})
  const norder = {}
  for (const n of config.bajos) {
    const dir = n === 'app' ? (config.dir.base + '/app') : getModuleDir(n)
    if (n !== 'app' && !fs.existsSync(`${dir}/bajo`)) throw error(`Package ${n} isn\'t a valid Bajo package`, { code: 'BAJO_INVALID_PACKAGE' })
    norder[n] = NaN
    try {
      norder[n] = Number(_.trim(fs.readFileSync(`${dir}/bajo/.boot-order`, 'utf8')))
    } catch (err) {}
  }
  let result = []
  _.forOwn(order, (v, k) => {
    const item = { k, v: _.isNaN(norder[k]) ? v : norder[k]}
    result.push(item)
  })
  return _.map(_.orderBy(result, ['v']), 'k')
}
