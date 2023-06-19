import buildHelper from '../../lib/build-helper.js'

export default async function (name, pkg) {
  const { _, log, freeze } = this.bajo.helper
  log.debug(`Attach helper: %s`, name)
  const dir = pkg === 'app' ? (this.bajo.config.dir.base + '/app') : this.bajo.helper.getModuleDir(pkg)
  this[name].helper = await buildHelper.call(this, `${dir}/bajo/helper`, { pkg: name })
  freeze(this[name].helper, true)
}