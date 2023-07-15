import _ from 'lodash'
import fs from 'fs-extra'

async function run ({ singles }) {
  const { runHook, log, eachPlugins, importModule, freeze, getConfig, print } = this.bajo.helper
  const config = getConfig()
  const methods = ['init']
  if (!_.get(config, 'tool')) methods.push('start')
  for (const f of methods) {
    await runHook(`bajo:${_.camelCase(`before ${f} all plugins`)}`)
    await eachPlugins(async function ({ name, dir }) {
      const file = `${dir}/bajo/${f}.js`
      if (fs.existsSync(file)) {
        log.debug(`%s: %s`, print.format(_.upperFirst(f)), name)
        await runHook(`bajo:${_.camelCase(`before ${f} ${name}`)}`)
        const item = await importModule(file)
        await item.call(this)
        await runHook(`bajo:${_.camelCase(`after ${f} ${name}`)}`)
      }
      if (f === 'init') freeze(this[name].config)
    })
    await runHook(`bajo:${_.camelCase(`after ${f} all plugins`)}`)
  }
  log.debug(`Loaded plugins: %s`, _.map(config.plugins, b => _.camelCase(b)).join(', '))
  if (singles.length > 0) {
    log.warn(`Unloaded 'single' plugins: %s`, _.map(singles, s => _.camelCase(s)).join(', '))
  }
}

export default run