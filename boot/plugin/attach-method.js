import createMethod from '../lib/create-method.js'

export default async function () {
  const { eachPlugins } = this.bajo
  const me = this
  me.bajo.log.debug('Attach methods')
  await eachPlugins(async function ({ ns, pkg }) {
    const dir = pkg === 'main' ? (me.bajo.config.dir.base + '/main') : me.bajo.getModuleDir(pkg)
    const num = await createMethod.call(me[ns], `${dir}/bajo/method`, pkg)
    // freeze(this[plugin].Method, true)
    me.bajo.log.trace('Attach method: %s (%d)', ns, num)
  })
}
