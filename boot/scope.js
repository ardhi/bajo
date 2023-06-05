const { EventEmitter } = require('events')
const event = new EventEmitter()
require('log-timestamp')

module.exports = function () {
  const bajo = {
    event
  }

  event.on('boot', data => {
    const [msg, code] = data
    bajo.log.trace(msg)
  })
  return { bajo }
}
