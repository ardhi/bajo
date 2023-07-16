import { get, camelCase, upperFirst, map } from 'lodash-es'
import fs from 'fs-extra'

async function run ({ singles }) {
  const { runHook, log, eachPlugins, importModule, freeze, getConfig, print } = this.bajo.helper
  const config = getConfig()
  const methods = ['init']
  if (!get(config, 'tool')) methods.push('start')
  for (const f of methods) {
    await runHook(`bajo:${camelCase(`before ${f} all plugins`)}`)
    await eachPlugins(async function ({ name, dir }) {
      const file = `${dir}/bajo/${f}.js`
      if (fs.existsSync(file)) {
        log.debug(`%s: %s`, print.__(upperFirst(f)), name)
        await runHook(`bajo:${camelCase(`before ${f} ${name}`)}`)
        const item = await importModule(file)
        await item.call(this)
        await runHook(`bajo:${camelCase(`after ${f} ${name}`)}`)
      }
      if (f === 'init') freeze(this[name].config)
    })
    await runHook(`bajo:${camelCase(`after ${f} all plugins`)}`)
  }
  log.debug(`Loaded plugins: %s`, map(config.plugins, b => camelCase(b)).join(', '))
  if (singles.length > 0) {
    log.warn(`Unloaded 'single' plugins: %s`, map(singles, s => camelCase(s)).join(', '))
  }
}

export default run