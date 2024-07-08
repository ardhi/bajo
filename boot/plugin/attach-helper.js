import buildHelper from '../lib/build-helper.js'
import { keys } from 'lodash-es'

async function attachHelper () {
  const { eachPlugins } = this.bajo.helper
  const me = this
  me.bajo.log.debug('Attach helpers')
  await eachPlugins(async function ({ ns, pkg }) {
    const dir = pkg === 'main' ? (me.bajo.config.dir.base + '/main') : me.bajo.helper.getModuleDir(pkg)
    me[ns].helper = await buildHelper.call(me, `${dir}/bajo/helper`, pkg)
    // freeze(this[plugin].helper, true)
    me.bajo.log.trace('Attach helper: %s (%d)', ns, keys(me[ns].helper).length)
  })
}

export default attachHelper
