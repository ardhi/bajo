export default async function () {
  const { log } = this.bajo.helper
  log.debug('Attach system report')
  process.on('uncaughtException', (error, origin) => {
    const { getConfig } = this.bajo.helper
    const config = getConfig()
    if (config.log.report.includes('sys:uncaughtException')) log.fatal({ origin }, error.message)
    setTimeout(() => {
      console.error(error)
      process.exit(1)
    }, 50)
  })

  process.on('unhandledRejection', (reason, err) => {
    const { callsites, getConfig } = this.bajo.helper
    const config = getConfig()
    const info = callsites()[2]
    const file = info.getFileName()
    const line = info.getLineNumber()
    if (config.log.report.includes('sys:unhandledRejection')) log.error({ reason, file, line }, err.message)
  })

  process.on('warning', warning => {
    const { getConfig } = this.bajo.helper
    const config = getConfig()
    if (config.log.report.includes('sys:warning')) log.error(warning.message)
  })
}
