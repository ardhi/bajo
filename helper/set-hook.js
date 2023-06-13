/**
 * @module helper/setHook
 */

/**
 * Set hook defined by parameter ```hookName```. Hook name should be in this following format:
 * ```<namespace>:<identifier>``` - where namespace is a valid Bajo name and
 * identifier is a unique string set by Bajo developer to identify a hook inside a Bajo
 *
 * @instance
 * @async
 * @param {string} hookName - Hook's name
 *
 * @example
 * const { setHook } = this.bajo.helper
 * await setHook('myBajo:afterStartApp')
 */

async function setHook (hookName) {
  const { _, log, fastGlob, walkBajos, getConfig } = this.bajo.helper
  const config = getConfig()
  const [pkg, action] = (hookName || '').split(':')
  await walkBajos(async function ({ cfg, name }) {
    const dir = `${cfg.dir}/${pkg}/hook`
    const files = await fastGlob(`${dir}/**/*.js`)
    if (files.length === 0) return undefined
    for (const f of files) {
      const actionName = _.camelCase(f.replace(dir, '').replace('.js', ''))
      if (actionName !== action) continue
      await require(f).call(this)
      if (config.log.report.includes('hook')) log.trace(`Run hook '${hookName}' by '${name}'`)
    }
  })
}

module.exports = setHook