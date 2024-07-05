import { set, get, camelCase, upperFirst, map } from 'lodash-es'

async function run () {
  const { runHook, eachPlugins, importModule, freeze, print, join } = this.bajo.helper
  const methods = ['init']
  if (!get(this.bajo.config, 'tool')) methods.push('start')
  for (const f of methods) {
    await runHook(`bajo:${camelCase(`before ${f} all plugins`)}`)
    await eachPlugins(async function ({ plugin, dir }) {
      const mod = await importModule(`${dir}/bajo/${f}.js`)
      if (mod) {
        this.app.bajo.log.debug('%s: %s', print.__(upperFirst(f)), plugin)
        await runHook(`bajo:${camelCase(`before ${f} ${plugin}`)}`)
        await mod.call(this.app[plugin])
        await runHook(`bajo:${camelCase(`after ${f} ${plugin}`)}`)
      }
      if (f === 'init') freeze(this.app[plugin].config)
      set(this, `app.${plugin}.state.${f}`, true)
    })
    await runHook(`bajo:${camelCase(`after ${f} all plugins`)}`)
  }
  this.bajo.log.debug('Loaded plugins: %s', join(map(this.bajo.config.plugins, b => camelCase(b))))
}

export default run
