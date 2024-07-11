import { set, camelCase, map } from 'lodash-es'

async function run () {
  const me = this
  const { runHook, eachPlugins, importModule, freeze, print, join } = me.bajo
  const methods = ['init:Initializing...:Initialization completed']
  if (!me.bajo.toolMode) methods.push('start:Starting...:Started')
  for (const method of methods) {
    const [f, begin, end] = method.split(':')
    await runHook(`bajo:${camelCase(`before ${f} all plugins`)}`)
    await eachPlugins(async function ({ ns, dir }) {
      const mod = await importModule(`${dir}/bajo/${f}.js`)
      if (mod) {
        this.log.debug('%s', print.__(begin))
        await runHook(`bajo:${camelCase(`before ${f} ${ns}`)}`)
        await mod.call(this)
        await runHook(`bajo:${camelCase(`after ${f} ${ns}`)}`)
        this.log.debug('%s', print.__(end))
      }
      if (f === 'init') freeze(this.config)
      set(me, `app.${ns}.state.${f}`, true)
    })
    await runHook(`bajo:${camelCase(`after ${f} all plugins`)}`)
  }
  me.bajo.log.debug('Loaded plugins: %s', join(map(me.bajo.config.plugins, b => camelCase(b))))
}

export default run
