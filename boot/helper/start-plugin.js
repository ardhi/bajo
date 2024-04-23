async function startPlugin (name, ...args) {
  const { getConfig, importModule } = this.bajo.helper
  const cfg = getConfig(name, { full: true })
  const start = await importModule(`${cfg.dir.pkg}/bajo/start.js`)
  await start.call(this, ...args)
}

export default startPlugin
