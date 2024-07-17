import createMethod from '../../../lib/create-method.js'

async function attachMethod () {
  const { eachPlugins } = this.bajo
  const me = this
  me.bajo.log.debug('Attach methods')
  await eachPlugins(async function ({ ns, pkgName }) {
    const dir = ns === me.bajo.mainNs ? (`${me.bajo.config.dir.base}/${me.bajo.mainNs}`) : me.bajo.getModuleDir(pkgName)
    const num = await createMethod.call(me[ns], `${dir}/bajo/method`, pkgName)
    me.bajo.log.trace('- %s (%d)', ns, num)
  })
}

export default attachMethod
