import { map, camelCase, merge, forOwn, groupBy } from 'lodash-es'

async function collectHooks () {
  const { eachPlugins, log, runHook, isLogInRange, importModule, pascalCase } = this.bajo.helper
  this.bajo.hooks = this.bajo.hooks ?? []
  log.debug('Collect hooks')
  // collects
  await eachPlugins(async function ({ plugin, dir, file }) {
    const hookName = (file.slice(dir.length + 1) ?? '').split('/')[1]
    let [ns, path] = hookName.replace('.js', '').split('@')
    if (!path) {
      path = ns
      ns = plugin
    }
    path = camelCase(path)
    ns = map(ns.split('.'), (n, i) => i === 1 ? pascalCase(n) : camelCase(n)).join('.')
    const mod = await importModule(file, { asHandler: true })
    if (!mod) return undefined
    merge(mod, { ns, path })
    this.bajo.hooks.push(mod)
  }, { glob: 'hook/**/*.js', insideBajo: true })
  await runHook('bajo:afterCollectHooks')
  // for log trace purpose only
  if (!isLogInRange('trace')) return
  const items = groupBy(this.bajo.hooks, 'ns')
  forOwn(items, (v, k) => {
    const hooks = groupBy(v, 'path')
    forOwn(hooks, (v1, k1) => {
      log.trace('Collect hook: %s:%s (%d)', k, k1, v1.length)
    })
  })
}

export default collectHooks
