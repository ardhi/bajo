import buildModuleCollector from '../../lib/build-module-collector.js'

export default async function () {
  const { _, walkBajos, log, runHook, isLogInRange } = this.bajo.helper
  this.bajo.hooks = this.bajo.hooks || []
  log.debug('Collect hooks')
  // collects
  await walkBajos(async function ({ name, dir, file }) {
    let [$, hookName] = (file.slice(dir.length + 1) || '').split('/')
    let [ns, path] = _.map(hookName.replace('.js', '').split('@'), e => _.camelCase(e))
    if (!path) {
      path = ns
      ns = name
    }
    const mod = await buildModuleCollector.call(this, file)
    if (!mod) return undefined
    _.merge(mod, { ns, path })
    this.bajo.hooks.push(mod)
  }, { glob: 'hook/**/*.js' })
  await runHook('bajo:afterCollectHooks')
  // for log trace purpose only
  if (!isLogInRange('trace')) return
  await walkBajos(async function ({ name }) {
    let hooks = _.filter(this.bajo.hooks, { ns: name })
    if (hooks.length === 0) return undefined
    const items = _.groupBy(hooks, 'path')
    for (const hook of hooks) {
      log.trace('Collect hook: %s:%s (%d)', hook.ns, hook.path, items[hook.path].length)
    }
  })
}