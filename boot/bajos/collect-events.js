import buildModuleCollector from '../../lib/build-module-collector.js'
const methods = ['on', 'off', 'once']

export default async function () {
  const { _, walkBajos, log, getConfig, runHook } = this.bajo.helper
  this.bajo.events = this.bajo.events || []
  log.debug('Collect events')
  await runHook('bajo:beforeCollectEvents')
  const config = getConfig()
  // collects
  await walkBajos(async function ({ name, dir, file }) {
    let [$, method, evtName] = (file.slice(dir.length + 1) || '').split('/')
    if (!methods.includes(method)) return undefined
    let [ns, path] = _.map(evtName.replace('.js', '').split('@'), e => _.camelCase(e))
    if (!path) {
      path = ns
      ns = name
    }
    const mod = await buildModuleCollector.call(this, file)
    if (!mod) return undefined
    _.merge(mod, { method, ns, path })
    this.bajo.events.push(mod)
  }, { glob: 'event/**/*.js' })
  // apply events
  await walkBajos(async function ({ name }) {
    for (const m of methods) {
      let events = _.filter(this.bajo.events, { ns: name, method: m })
      if (events.length === 0) return undefined
      const items = _.groupBy(events, 'path')
      for (const i in items) {
        const fns = _.orderBy(items[i], ['level'])
        log.trace('Collect event: %s:%s:%s (%d)', name, m, i, fns.length)
        this.bajo.emitter[m](`${name}:${i}`, async (...args) => {
          for (const fn of fns) {
            const id = `event:${name}:${m}:${i}`
            if (config.log.report.includes(id)) {
              log.trace({ args }, `Call listener '%s'`, id)
            }
            await fn.handler.call(this, ...args)
          }
        })
      }
    }
  })
  await runHook('bajo:afterCollectEvents')
}