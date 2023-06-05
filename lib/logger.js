const util = require('util')
const os = require('os')
const _ = require('lodash')
const pretty = require('prettyjson')
const dateFormat = require('dateformat')
const levels = require('../lib/logger-levels')
const levelList = _.keys(levels)
const levelChars = 6
const prettyOpts = {
  noAlign: true,
  defaultIndentation: 2,
  renderUndefined: true
}

module.exports = function logger () {
  const log = {}
  _.each(levelList, l => {
    log[l] = (...params) => {
      const config = this.bajo.config
      const logLevel = _.indexOf(levelList, config.logLevel)
      if (!(_.indexOf(levelList, l) >= logLevel)) return
      let [data, msg, ...args] = params
      if (_.isString(data)) {
        args.unshift(msg)
        msg = data
      }
      args = _.without(args, undefined)
      let text
      const dt = new Date()
      if (config.dev) {
        text = `[${dateFormat(dt, 'isoUtcDateTime')}] ${_.padEnd(_.upperFirst(l) + ':', levelChars, ' ')} ${util.format(msg, ...args)}`
        if (_.isPlainObject(data)) text += '\n  ' + (pretty.render(data, prettyOpts).split('\n').join('\n  '))
      } else {
        const json = { level: levels[l], time: dt.valueOf(), pid: process.pid, hostname: os.hostname() }
        if (_.isPlainObject(data)) _.merge(json, data)
        _.merge(json, { msg: util.format(msg, ...args) })
        text = JSON.stringify(json)
      }
      console.log(text)
    }
  })
  return log
}
