import buildHelper from '../lib/build-helper.js'
import { keys } from 'lodash-es'

async function runner (plugin, pkg) {
  const { log, freeze } = this.bajo.helper
  const dir = pkg === 'app' ? (this.bajo.config.dir.base + '/app') : this.bajo.helper.getModuleDir(pkg)
  this[plugin].helper = await buildHelper.call(this, `${dir}/bajo/helper`, pkg)
  freeze(this[plugin].helper, true)
  log.trace('Attach helper: %s (%d)', plugin, keys(this[plugin].helper).length)
}

async function attachHelper () {
  const { log, eachPlugins } = this.bajo.helper
  log.debug('Attach helpers')
  await eachPlugins(async function ({ plugin, pkg }) {
    await runner.call(this, plugin, pkg)
  })
}

export default attachHelper
