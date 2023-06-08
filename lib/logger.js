const util = require('util')
const os = require('os')
const _ = require('lodash')
const pretty = require('prettyjson')
const dateFormat = require('dateformat')
const levels = require('../helper/log-levels')
const levelList = _.keys(levels)
const levelChars = 6
const prettyOpts = {
  noAlign: true,
  defaultIndentation: 2,
  renderUndefined: true
}
const getPackageName = require('get-package-name')

module.exports = function logger () {
  const log = {}
  _.each(levelList, l => {
    log[l] = (...params) => {
      const config = this.bajo.config
      const logLevel = _.indexOf(levelList, config.log.level)
      if (!(_.indexOf(levelList, l) >= logLevel)) return
      let [data, msg, ...args] = params
      if (_.isString(data)) {
        args.unshift(msg)
        msg = data
        data = null
      }
      args = _.without(args, undefined)
      let text
      const dt = new Date()
      if (config.env === 'prod') {
        const json = { level: levels[l], time: dt.valueOf(), pid: process.pid, hostname: os.hostname() }
        if (data) _.merge(json, data)
        _.merge(json, { msg: util.format(msg, ...args) })
        text = JSON.stringify(json)
      } else {
        text = `[${dateFormat(dt, 'isoUtcDateTime')}] ${_.padEnd(_.upperFirst(l) + ':', levelChars, ' ')} ${util.format(msg, ...args)}`
        if (data) text += '\n  ' + (pretty.render(data, prettyOpts).split('\n').join('\n  '))
      }
      if (!config.log.logger) config.log.logger = 'bajoExtra'
      if (this[config.log.logger] && this[config.log.logger].logger) {
        this[config.log.logger].logger[l]({ data, msg, args })
      } else console.log(text)
    }
  })
  return log
}
