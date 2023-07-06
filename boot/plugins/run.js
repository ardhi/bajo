import _ from 'lodash'
import fs from 'fs-extra'

async function run ({ singles }) {
  const { runHook, log, eachPlugins, importModule, freeze, getConfig } = this.bajo.helper
  const config = getConfig()
  const methods = ['init']
  if (!_.get(config, 'run.tool')) methods.push('start')
  for (const f of methods) {
    await runHook(`bajo:${_.camelCase(`before ${f} all plugins`)}`)
    await eachPlugins(async function ({ name, cfg }) {
      const file = `${cfg.dir}/bajo/${f}.js`
      if (fs.existsSync(file)) {
        log.debug(`%s: %s`, _.upperFirst(f), name)
        await runHook(`bajo:${_.camelCase(`before ${f} ${name}`)}`)
        const item = await importModule(file)
        await item.call(this)
        await runHook(`bajo:${_.camelCase(`after ${f} ${name}`)}`)
      }
      if (f === 'init') freeze(cfg)
    })
    await runHook(`bajo:${_.camelCase(`after ${f} all plugins`)}`)
  }
  log.debug(`Loaded plugins: ${_.map(config.plugins, b => _.camelCase(b)).join(', ')}`)
  if (singles.length > 0) {
    log.warn(`Unloaded 'single' plugins: ${_.map(singles, s => _.camelCase(s)).join(', ')}`)
  }
}

export default run