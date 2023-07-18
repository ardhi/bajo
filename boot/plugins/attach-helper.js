import buildHelper from '../lib/build-helper.js'
import { keys } from 'lodash-es'

async function runner (name, pkgName) {
  const { log, freeze } = this.bajo.helper
  const dir = pkgName === 'app' ? (this.bajo.config.dir.base + '/app') : this.bajo.helper.getModuleDir(pkgName)
  this[name].helper = await buildHelper.call(this, `${dir}/bajo/helper`, { pkgName: name })
  freeze(this[name].helper, true)
  log.trace('Attach helper: %s (%d)', name, keys(this[name].helper).length)
}

async function attachHelper () {
  const { log, eachPlugins } = this.bajo.helper
  log.debug('Attach helpers')
  await eachPlugins(async function ({ name, pkgName }) {
    await runner.call(this, name, pkgName)
  })
}

export default attachHelper
