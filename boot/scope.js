const { EventEmitter } = require('events')
const _ = require('lodash')
const levels = require('../helper/log-levels')
const event = new EventEmitter()

module.exports = function () {
  const bajo = {
    event
  }

  event.on('boot', params => {
    let [code, data, msg, ...args] = params
    if (_.isString(data)) {
      args.unshift(msg)
      msg = data
    }
    if (_.keys(levels).includes(args[0])) {
      const [method, ...a] = args
      if (_.isString(data)) bajo.log[method](msg, ...a)
      else if (bajo.config.argv.trace === false) bajo.log[method](msg, ...a)
      else bajo.log[method](data, msg, ...a)
    }
  })
  return { bajo }
}
