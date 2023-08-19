import { map, camelCase, merge, filter, groupBy } from 'lodash-es'

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
  await eachPlugins(async function ({ plugin }) {
    const hooks = filter(this.bajo.hooks, h => h.ns.startsWith(plugin))
    if (hooks.length === 0) return undefined
    const items = groupBy(hooks, 'path')
    for (const hook of hooks) {
      log.trace('Collect hook: %s:%s (%d)', hook.ns, hook.path, items[hook.path].length)
    }
  })
}

export default collectHooks
