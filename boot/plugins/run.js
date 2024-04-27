import { set, get, camelCase, upperFirst, map } from 'lodash-es'

async function run () {
  const { runHook, log, eachPlugins, importModule, freeze, getConfig, print } = this.bajo.helper
  const config = getConfig()
  const methods = ['init']
  if (!get(config, 'tool')) methods.push('start')
  for (const f of methods) {
    await runHook(`bajo:${camelCase(`before ${f} all plugins`)}`)
    await eachPlugins(async function ({ plugin, dir }) {
      const mod = await importModule(`${dir}/bajo/${f}.js`)
      if (mod) {
        log.debug('%s: %s', print.__(upperFirst(f)), plugin)
        await runHook(`bajo:${camelCase(`before ${f} ${plugin}`)}`)
        await mod.call(this)
        await runHook(`bajo:${camelCase(`after ${f} ${plugin}`)}`)
      }
      if (f === 'init') freeze(this[plugin].config)
      set(this, `${plugin}.state.${f}`, true)
    })
    await runHook(`bajo:${camelCase(`after ${f} all plugins`)}`)
  }
  log.debug('Loaded plugins: %s', map(config.plugins, b => camelCase(b)).join(', '))
}

export default run
