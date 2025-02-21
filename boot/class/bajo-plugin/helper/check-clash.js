import lodash from 'lodash'

const { find } = lodash

async function checkAlias () {
  const { eachPlugins } = this.bajo
  this.bajo.log.debug('checkAliasNameClash')
  const refs = []
  await eachPlugins(async function ({ ns, pkgName, alias }) {
    let item = find(refs, { ns })
    if (item) throw this.error('pluginNameClash%s%s%s%s', ns, pkgName, item.ns, item.pkgName, { code: 'BAJO_NAME_CLASH' })
    item = find(refs, { alias })
    if (item) throw this.error('pluginNameClash%s%s%s%s', alias, pkgName, item.alias, item.pkgName, { code: 'BAJO_ALIAS_CLASH' })
    refs.push({ ns, alias, pkgName })
  })
}

export default checkAlias
