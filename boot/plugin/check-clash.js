import { find } from 'lodash-es'
import error from '../core/method/error.js'

async function checkAlias () {
  const { eachPlugins } = this.bajo
  this.bajo.log.debug('Checking alias & name clashes')
  const refs = []
  await eachPlugins(async function ({ ns, pkg, alias }) {
    let item = find(refs, { plugin: ns })
    if (item) throw error('Plugin name clash: \'%s (%s)\' with \'%s (%s)\'', ns, pkg, item.plugin, item.pkg, { code: 'BAJO_NAME_CLASH' })
    item = find(refs, { alias })
    if (item) throw error('Plugin alias clash: \'%s (%s)\' with \'%s (%s)\'', alias, pkg, item.alias, item.pkg, { code: 'BAJO_ALIAS_CLASH' })
    refs.push({ plugin: ns, alias, pkg })
  })
  this.bajo.pluginRefs = refs
}

export default checkAlias
