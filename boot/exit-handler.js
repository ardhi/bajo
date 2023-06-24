async function exit (signal) {
  const { walkBajos, fs, log, importModule } = this.bajo.helper
  log.warn(`${signal} signal received`)
  await walkBajos(async function ({ name, cfg }) {
    const handler = this.bajo.exitHandler[name]
    if (!handler) return undefined
    await handler.call(this)
    log.debug(`Exited: %s`, name)
  })
  log.debug('Program shutdown')
  process.exit(0)
}

export default async function () {
  const { log } = this.bajo.helper
  process.on('SIGINT', async () => {
    await exit.call(this, 'SIGINT')
  })

  process.on('SIGTERM', async () => {
    await exit.call(this, 'SIGTERM')
  })
  log.debug('Exit handlings')
}
