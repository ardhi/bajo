import { map, camelCase, merge, forOwn, groupBy } from 'lodash-es'

async function collectHooks () {
  const { eachPlugins, runHook, isLogInRange, importModule } = this.bajo
  const me = this
  me.bajo.hooks = this.bajo.hooks ?? []
  me.bajo.log.debug('Collect hooks')
  // collects
  await eachPlugins(async function ({ ns, dir, file }) {
    const hookName = (file.slice(dir.length + 1) ?? '').split('/')[1]
    let [name, path] = hookName.replace('.js', '').split('@')
    if (!path) {
      path = name
      name = ns
    }
    path = camelCase(path)
    name = map(name.split('.'), (n, i) => i === 1 ? n : camelCase(n)).join('.')
    const mod = await importModule(file, { asHandler: true })
    if (!mod) return undefined
    merge(mod, { ns: name, path, src: ns })
    me.bajo.hooks.push(mod)
  }, { glob: 'hook/**/*.js', baseNs: me.bajo.name })
  // for log trace purpose only
  if (!isLogInRange('trace')) return
  const items = groupBy(me.bajo.hooks, 'ns')
  forOwn(items, (v, k) => {
    const hooks = groupBy(v, 'path')
    forOwn(hooks, (v1, k1) => {
      me.bajo.log.trace('Collect hook: %s:%s (%d)', k, k1, v1.length)
    })
  })
  // run handler
  await runHook('bajo:afterCollectHooks')
}

export default collectHooks
