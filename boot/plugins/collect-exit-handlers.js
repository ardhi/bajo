async function collectExitHandlers (pkg) {
  const { _, fs, importModule, log, eachPlugins } = this.bajo.helper
  this.bajo.exitHandler = this.bajo.exitHandler || {}
  const names = []
  await eachPlugins(async function ({ name, cfg }) {
    const file = `${cfg.dir}/bajo/exit.js`
    if (!fs.existsSync(file)) return undefined
    try {
      let mod = await importModule(file)
      this.bajo.exitHandler[name] = mod
      names.push(name)
    } catch (err) {
    }
  })
  log.trace('Exit handlers: %s', names.length === 0 ? 'none' : names.join(', '))
}

export default collectExitHandlers