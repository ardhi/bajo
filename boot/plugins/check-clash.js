import { find } from 'lodash-es'
import error from '../helper/error.js'

async function checkAlias () {
  const { log, eachPlugins } = this.bajo.helper
  log.debug('Checking alias & name clashes')
  const refs = []
  await eachPlugins(async function ({ name, pkgName, alias }) {
    let item = find(refs, { name })
    if (item) throw error(`Plugin name clash: '%s (%s)' with '%s (%s)'`, name, pkgName, item.name, item.pkgName, { code: 'BAJO_NAME_CLASH' })
    item = find(refs, { alias })
    if (item) throw error(`Plugin alias clash: '%s (%s)' with '%s (%s)'`, alias, pkgName, item.alias, item.pkgName, { code: 'BAJO_ALIAS_CLASH' })
    refs.push({ name, alias, pkgName })
  })
  this.bajo.pluginRefs = refs
}

export default checkAlias