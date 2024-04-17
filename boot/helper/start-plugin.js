async function startPlugin (name, opts) {
  const { getConfig, importModule } = this.bajo.helper
  const cfg = getConfig(name, { full: true })
  const start = await importModule(`${cfg.dir.pkg}/bajo/start.js`)
  await start.call(this, opts)
}

export default startPlugin
