async function exit (signal) {
  const { walkBajos, log } = this.bajo.helper
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
  log.debug('Exit handlings')

  process.on('SIGINT', async () => {
    await exit.call(this, 'SIGINT')
  })

  process.on('SIGTERM', async () => {
    await exit.call(this, 'SIGTERM')
  })

  process.on('uncaughtException', (error, origin) => {
    const { getConfig } = this.bajo.helper
    const config = getConfig()
    if (config.log.report.includes('sys:uncaughtException')) log.fatal({ origin }, error.message)
    setTimeout(() => {
      console.error(error)
      process.exit(1)
    }, 50)
  })

  process.on('unhandledRejection', (reason, promise) => {
    const stackFile = reason.stack.split('\n')[1]
    let file
    const info = stackFile.match(/\((.*)\)/) // file is in (<file>)
    if (info) file = info[1]
    else if (stackFile.startsWith('    at ')) file = stackFile.slice(7) // file is stackFile itself
    if (!file) return
    const parts = file.split(':')
    const column = parseInt(parts[parts.length - 1])
    const line = parseInt(parts[parts.length - 2])
    parts.pop()
    parts.pop()
    file = parts.join(':')
    log.error({ file, line, column }, reason.message)
  })

  process.on('warning', warning => {
    const { getConfig } = this.bajo.helper
    log.error(warning.message)
  })

}
