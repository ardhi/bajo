import createMethod from '../../../lib/create-method.js'

export default async function () {
  const { eachPlugins } = this.bajo
  const me = this
  me.bajo.log.debug('Attach methods')
  await eachPlugins(async function ({ ns, pkgName }) {
    const dir = ns === me.bajo.mainNs ? (`${me.bajo.config.dir.base}/${me.bajo.mainNs}`) : me.bajo.getModuleDir(pkgName)
    const num = await createMethod.call(me[ns], `${dir}/bajo/method`, pkgName)
    me.bajo.log.trace('Attach method: %s (%d)', ns, num)
  })
}
