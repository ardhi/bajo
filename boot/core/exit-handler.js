async function exit (signal) {
  const me = this
  const { eachPlugins } = me.bajo
  me.bajo.log.warn('\'%s\' signal received', signal)
  await eachPlugins(async function ({ ns }) {
    const handler = me.bajo.exitHandler[ns]
    if (!handler) return undefined
    try {
      await handler.call(me[ns])
    } catch (err) {}
    this.log.debug('Exited')
  })
  me.bajo.log.debug('Program shutdown')
  process.exit(0)
}

async function exitHandler () {
  if (!this.bajo.config.exitHandler) return

  process.on('SIGINT', async () => {
    await exit.call(this, 'SIGINT')
  })

  process.on('SIGTERM', async () => {
    await exit.call(this, 'SIGTERM')
  })

  process.on('uncaughtException', (error, origin) => {
    if (this.bajo.config.log.report.includes('sys:uncaughtException')) this.bajo.log.fatal({ origin }, '%s', error.message)
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
    this.bajo.log.error({ file, line, column }, '%s', reason.message)
  })

  process.on('warning', warning => {
    this.bajo.log.error('%s', warning.message)
  })
}

export default exitHandler
