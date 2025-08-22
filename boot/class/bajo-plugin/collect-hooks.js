import lodash from 'lodash'

const { merge, forOwn, groupBy } = lodash

async function collectHooks () {
  const { eachPlugins, runHook, isLogInRange, importModule, breakNsPathFromFile } = this.bajo
  const me = this
  me.bajo.hooks = this.bajo.hooks ?? []
  me.bajo.log.debug('collectHooks')
  // collects
  await eachPlugins(async function ({ dir, file }) {
    const { name: ns } = this
    const { fullNs, path } = breakNsPathFromFile({ file, dir, baseNs: ns, suffix: '/hook/' })
    const mod = await importModule(file, { asHandler: true })
    if (!mod) return undefined
    merge(mod, { ns: fullNs, path, src: ns })
    me.bajo.hooks.push(mod)
  }, { glob: 'hook/**/*.js', prefix: me.bajo.name })
  // for log trace purpose only
  if (!isLogInRange('trace')) return
  const items = groupBy(me.bajo.hooks, 'ns')
  forOwn(items, (v, k) => {
    const hooks = groupBy(v, 'path')
    forOwn(hooks, (v1, k1) => {
      me.bajo.log.trace('- %s:%s (%d)', k, k1, v1.length)
    })
  })
  // run handler
  await runHook('bajo:afterCollectHooks')
}

export default collectHooks
