module.exports = async function (item = '') {
  const { _, log, fastGlob, walkBajos, getConfig } = this.bajo.helper
  const config = getConfig()
  const [pkg, action] = item.split(':')
  await walkBajos(async function ({ cfg, name }) {
    const dir = `${cfg.dir}/${pkg}/hook`
    const files = await fastGlob(`${dir}/**/*.js`)
    if (files.length === 0) return undefined
    for (const f of files) {
      const actionName = _.camelCase(f.replace(dir, '').replace('.js', ''))
      if (actionName !== action) continue
      await require(f).call(this)
      if (config.log.report.includes('hook')) log.trace(`Run hook '${item}' by '${name}'`)
    }
  })
}

