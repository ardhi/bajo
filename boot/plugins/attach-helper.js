import buildHelper from '../lib/build-helper.js'
import { keys } from 'lodash-es'

async function runner (plugin, pkg) {
  const dir = pkg === 'main' ? (this.bajo.config.dir.base + '/main') : this.bajo.helper.getModuleDir(pkg)
  this[plugin].helper = await buildHelper.call(this[plugin], `${dir}/bajo/helper`, pkg)
  // freeze(this[plugin].helper, true)
  this.bajo.log.trace('Attach helper: %s (%d)', plugin, keys(this[plugin].helper).length)
}

async function attachHelper () {
  const { eachPlugins } = this.bajo.helper
  this.bajo.log.debug('Attach helpers')
  await eachPlugins(async function ({ plugin, pkg }) {
    await runner.call(this.app, plugin, pkg)
  })
}

export default attachHelper
