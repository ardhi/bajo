module.exports = async function () {
  process.on('uncaughtException', (error, origin) => {
    this.bajo.event.emit('exception', [{ error, origin }, err.message, 'fatal'])
    setTimeout(() => {
      process.exit(1)
    }, 50)
  })

  process.on('unhandledRejection', (reason, err) => {
    const stack = (err.stack.split("at ")[2]).trim()
    const line = stack.match(/\(([^()]*)\)/)[1]
    this.bajo.event.emit('exception', [{ reason, line }, err.message, 'error'])
  })

  process.on('warning', warning => {
    this.bajo.event.emit('exception', [{ warning }, warning.message, 'warn'])
  })

  this.bajo.event.emit('boot', [`exceptionHandler`, `Exception handler: %s`, 'debug', 'core'])

}
