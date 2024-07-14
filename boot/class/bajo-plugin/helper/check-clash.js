import { find } from 'lodash-es'
import error from '../../bajo-core/method/error.js'

async function checkAlias () {
  const { eachPlugins } = this.bajo
  this.bajo.log.debug('Checking alias & name clashes')
  const refs = []
  await eachPlugins(async function ({ ns, pkgName, alias }) {
    let item = find(refs, { ns })
    if (item) throw error('Plugin name clash: \'%s (%s)\' with \'%s (%s)\'', ns, pkgName, item.ns, item.pkgName, { code: 'BAJO_NAME_CLASH' })
    item = find(refs, { alias })
    if (item) throw error('Plugin alias clash: \'%s (%s)\' with \'%s (%s)\'', alias, pkgName, item.alias, item.pkgName, { code: 'BAJO_ALIAS_CLASH' })
    refs.push({ ns, alias, pkgName })
  })
}

export default checkAlias
