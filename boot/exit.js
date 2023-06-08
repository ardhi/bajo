async function exit (signal) {
  const { walkBajos, fs } = this.bajo.helper
  this.bajo.log.warn(`${signal} signal received`)
  await walkBajos(async function ({ name, cfg }) {
    const file = `${cfg.dir}/bajo/exit.js`
    if (fs.existsSync(file)) {
      await require(file).call(this)
      this.bajo.log.debug(`Service exited: %s`, name)
    }
  })
  this.bajo.log.debug('Program shutdown')
  process.exit(0)
}

module.exports = async function () {
  process.on('SIGINT', async () => {
    await exit.call(this, 'SIGINT')
  })

  process.on('SIGTERM', async () => {
    await exit.call(this, 'SIGTERM')
  })
  this.bajo.event.emit('boot', [`exitHandler`, `Exit handler: %s`, 'debug', 'core'])
}
