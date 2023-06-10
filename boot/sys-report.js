module.exports = async function () {
  const { log } = this.bajo.helper
  log.debug('Attach system report')
  process.on('uncaughtException', (error, origin) => {
    const { getConfig } = this.bajo.helper
    const config = getConfig()
    if (config.log.report.includes('sysreport')) log.fatal({ error, origin }, err.message)
    setTimeout(() => {
      process.exit(1)
    }, 50)
  })

  process.on('unhandledRejection', (reason, err) => {
    const { callsites, getConfig } = this.bajo.helper
    const config = getConfig()
    const line = callsites()[2].getFileName()
    if (config.log.report.includes('sysreport')) log.error({ reason, line }, err.message)
  })

  process.on('warning', warning => {
    const { getConfig } = this.bajo.helper
    const config = getConfig()
    if (config.log.report.includes('sysreport')) log.error(warning.message)
  })
}
