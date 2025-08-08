async function exit (signal) {
  const { eachPlugins } = this
  this.log.warn('signalReceived%s', signal)
  await eachPlugins(async function ({ ns }) {
    try {
      await this.stop()
    } catch (err) {}
    this.log.trace('exited')
  })
  this.log.debug('appShutdown')
  process.exit(0)
}

async function exitHandler () {
  if (!this.config.exitHandler) return

  process.on('SIGINT', async () => {
    await exit.call(this, 'SIGINT')
  })

  process.on('SIGTERM', async () => {
    await exit.call(this, 'SIGTERM')
  })

  process.on('uncaughtException', (error, origin) => {
    setTimeout(() => {
      console.error(error)
      // process.exit(1)
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
    this.log.error({ file, line, column }, '%s', reason.message)
  })

  process.on('warning', warning => {
    this.log.error('%s', warning.message)
  })
}

export default exitHandler
