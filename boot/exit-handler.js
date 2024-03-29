async function exit (signal) {
  const { eachPlugins, log } = this.bajo.helper
  log.warn('\'%s\' signal received', signal)
  await eachPlugins(async function ({ plugin }) {
    const handler = this.bajo.exitHandler[plugin]
    if (!handler) return undefined
    try {
      await handler.call(this)
    } catch (err) {}
    log.debug('Exited: %s', plugin)
  })
  log.debug('Program shutdown')
  process.exit(0)
}

async function exitHandler () {
  const { log, getConfig } = this.bajo.helper
  const config = getConfig()
  if (!config.exitHandler) return

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
    if (config.log.report.includes('sys:uncaughtException')) log.fatal({ origin }, '%s', error.message)
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
    log.error({ file, line, column }, '%s', reason.message)
  })

  process.on('warning', warning => {
    log.error('%s', warning.message)
  })
}

export default exitHandler
