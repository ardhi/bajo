import buildHelper from '../lib/build-helper.js'
import _ from 'lodash'

async function runner (name, pkg) {
  const { log, freeze } = this.bajo.helper
  const dir = pkg === 'app' ? (this.bajo.config.dir.base + '/app') : this.bajo.helper.getModuleDir(pkg)
  this[name].helper = await buildHelper.call(this, `${dir}/bajo/helper`, { pkg: name })
  freeze(this[name].helper, true)
  log.trace(`Attach helper: %s (%d)`, name, _.keys(this[name].helper).length)
}

async function attachHelper () {
  const { log, eachPlugins } = this.bajo.helper
  log.debug('Attach helpers')
  await eachPlugins(async function ({ name, pkg }) {
    await runner.call(this, name, pkg)
  })
}

export default attachHelper
