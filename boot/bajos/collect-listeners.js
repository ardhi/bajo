const listeners = {}

export default async function () {
  const { _, walkBajos, importModule, log, getConfig, setHook } = this.bajo.helper
  log.debug('Collect listeners')
  await setHook('bajo:beforeCollectListeners')
  const config = getConfig()
  // collects
  await walkBajos(async function ({ name, dir, file }) {
    let [$, method, evtName] = (file.slice(dir.length + 1) || '').split('/')
    if (!['on', 'once', 'off'].includes(method)) return undefined
    let [ns, path] = _.map(evtName.replace('.js', '').split('@'), e => _.camelCase(e))
    if (!path) {
      path = ns
      ns = name
    }
    const fullPath = `${ns}:${path}`
    let mod = await importModule(file)
    if (_.isFunction(mod)) mod = { level: 999, handler: mod, file }
    else if (_.isPlainObject(mod)) mod.file = file
    else return undefined
    if (mod.handler.constructor.name !== 'AsyncFunction') {
      const oldHandler = mod.handler
      mod.handler = async function (...args) {
        oldHandler.call(this, ...args)
      }
    }
    listeners[method] = listeners[method] || {}
    listeners[method][fullPath] = listeners[method][fullPath] || []
    listeners[method][fullPath].push(mod)
  }, { glob: 'event/**/*.js' })
  // apply listeners
  _.forOwn(listeners, (v, method) => {
    _.forOwn(v, (fns, fullPath) => {
      log.trace('Collect listener: %s:%s (%d)', method, fullPath, fns.length)
      this.bajo.event[method](fullPath, async (...args) => {
        const name = `event:${method}:${fullPath}`
        fns = _.orderBy(fns, ['level'])
        for (const fn of fns) {
          if (config.log.report.includes(name)) {
            log.trace({ args, file: fn.file }, `Call listener: '%s'`, name)
          }
          await fn.handler.call(this, ...args)
        }
      })
    })
  })
  await setHook('bajo:afterCollectListeners')
}