const methods = ['init', 'start']

async function run ({ singles }) {
  const { _, runHook, log, walkBajos, fs, importModule, freeze, getConfig } = this.bajo.helper
  const config = getConfig()
  for (const f of methods) {
    await runHook(`bajo:${_.camelCase(`before ${f} all bajos`)}`)
    await walkBajos(async function ({ name, cfg }) {
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
    await runHook(`bajo:${_.camelCase(`after ${f} all bajos`)}`)
  }
  log.debug(`Loaded: ${_.map(config.bajos, b => _.camelCase(b)).join(', ')}`)
  if (singles.length > 0) {
    log.warn(`Unloaded single marked bajo: ${_.map(singles, s => _.camelCase(s)).join(', ')}`)
  }
}

export default run