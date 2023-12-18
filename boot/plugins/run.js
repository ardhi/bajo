import { set, get, camelCase, upperFirst, map } from 'lodash-es'

async function run ({ singles }) {
  const { runHook, log, eachPlugins, importModule, freeze, getConfig, print } = this.bajo.helper
  const config = getConfig()
  const methods = ['init']
  if (!get(config, 'tool')) methods.push('start')
  for (const f of methods) {
    await runHook(`bajo:${camelCase(`before ${f} all plugins`)}`)
    await eachPlugins(async function ({ plugin, dir }) {
      const file = `${dir}/bajo/${f}.js`
      const mod = await importModule(file)
      if (mod) {
        log.debug('%s: %s', print.__(upperFirst(f)), plugin)
        await runHook(`bajo:${camelCase(`before ${f} ${plugin}`)}`)
        const params = f === 'start' ? ['all', true] : []
        await mod.call(this, ...params)
        await runHook(`bajo:${camelCase(`after ${f} ${plugin}`)}`)
      }
      if (f === 'init') freeze(this[plugin].config)
      set(this, `${plugin}.state.${f}`, true)
    })
    await runHook(`bajo:${camelCase(`after ${f} all plugins`)}`)
  }
  log.debug('Loaded plugins: %s', map(config.plugins, b => camelCase(b)).join(', '))
  if (singles.length > 0) {
    log.warn('Unloaded \'single\' plugins: %s', map(singles, s => camelCase(s)).join(', '))
  }
}

export default run
