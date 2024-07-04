async function startPlugin (name, ...args) {
  const { importModule } = this.app.bajo.helper
  const start = await importModule(`${name}:/bajo/start.js`)
  await start.call(this, ...args)
}

export default startPlugin
