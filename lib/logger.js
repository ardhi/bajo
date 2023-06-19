/**
 * test test
 *
 * @kind function
 * @name logger
 * @returns {Object}
 *
 */

import util from 'util'
import os from 'os'
import _ from 'lodash'
import pretty from 'prettyjson'
import dateFormat from 'dateformat'
import getBajo from '../helper/get-bajo.js'
import levels from '../helper/log-levels.js'

const levelList = _.keys(levels)
const levelChars = 6
const prettyOpts = {
  noAlign: true,
  defaultIndentation: 2,
  renderUndefined: true
}

export default function logger () {
  const log = {}
  _.each(levelList, l => {
    log[l] = (...params) => {
      const config = this.bajo.config
      if (config.silent) return
      const logLevel = _.indexOf(levelList, config.log.level)
      if (!(_.indexOf(levelList, l) >= logLevel)) return
      let [data, msg, ...args] = params
      if (_.isString(data)) {
        args.unshift(msg)
        msg = data
        data = null
      }
      args = _.without(args, undefined)
      const pkg = getBajo.handler.call(this)
      msg = `[${pkg}] ${msg}`
      let text
      const dt = new Date()
      if (config.env === 'prod') {
        const json = { level: levels[l], time: dt.valueOf(), pid: process.pid, hostname: os.hostname() }
        if (!_.isEmpty(data)) _.merge(json, data)
        _.merge(json, { msg: util.format(msg, ...args) })
        text = JSON.stringify(json)
      } else {
        text = `[${dateFormat(dt, config.log.dateFormat)}] ${_.padEnd(_.upperFirst(l) + ':', levelChars, ' ')} ${util.format(msg, ...args)}`
        if (!_.isEmpty(data)) text += '\n  ' + (pretty.render(data, prettyOpts).split('\n').join('\n  '))
      }
      if (!config.log.logger) config.log.logger = 'bajoExtra'
      if (this[config.log.logger] && this[config.log.logger].logger) {
        this[config.log.logger].logger[l]({ data, msg, args })
      } else console.log(text)
    }
  })
  return log
}
