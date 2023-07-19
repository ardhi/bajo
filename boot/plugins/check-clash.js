import { find } from 'lodash-es'
import error from '../helper/error.js'

async function checkAlias () {
  const { log, eachPlugins } = this.bajo.helper
  log.debug('Checking alias & name clashes')
  const refs = []
  await eachPlugins(async function ({ plugin, pkg, alias }) {
    let item = find(refs, { plugin })
    if (item) throw error('Plugin name clash: \'%s (%s)\' with \'%s (%s)\'', plugin, pkg, item.plugin, item.pkg, { code: 'BAJO_NAME_CLASH' })
    item = find(refs, { alias })
    if (item) throw error('Plugin alias clash: \'%s (%s)\' with \'%s (%s)\'', alias, pkg, item.alias, item.pkg, { code: 'BAJO_ALIAS_CLASH' })
    refs.push({ plugin, alias, pkg })
  })
  this.bajo.pluginRefs = refs
}

export default checkAlias
