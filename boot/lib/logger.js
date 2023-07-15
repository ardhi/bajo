/**
 * test test
 *
 * @kind function
 * @name logger
 * @returns {Object}
 *
 */

import print from '../helper/print.js'
import os from 'os'
import _ from 'lodash'
// import pretty from 'prettyjson'
import getPluginName from '../helper/get-plugin-name.js'
import levels from '../helper/log-levels.js'
import isLogInRange from '../helper/is-log-in-range.js'
import dayjs from 'dayjs'

const levelList = _.keys(levels)

/*
const prettyOpts = {
  noAlign: true,
  defaultIndentation: 2,
  renderUndefined: true
}
*/

export default function logger () {
  const config = this.bajo.config
  // const format = config.log.dateFormat
  const format = 'YYYY-MM-DDTHH:MM:ss.SSS[Z]'
  const log = {}
  const self = this
  log.child = () => {
    if (!config.log.logger) config.log.logger = 'bajoLogger'
    if (self[config.log.logger] && self[config.log.logger].logger) return self[config.log.logger].logger.child()
    return self
  }
  _.each(levelList, l => {
    log[l] = (...params) => {
      const config = this.bajo.config
      if (config.log.level === 'silent') return
      if (!isLogInRange.call(this, l)) return
      let [data, msg, ...args] = params
      if (_.isString(data)) {
        args.unshift(msg)
        msg = data
        data = null
      }
      args = _.without(args, undefined)
      const pkg = getPluginName.call(this)
      args.unshift(pkg)
      msg = `[%s] ${msg}`
      let text
      const dt = new Date()
      if (config.env === 'prod') {
        const json = { level: levels[l], time: dt.valueOf(), pid: process.pid, hostname: os.hostname() }
        if (!_.isEmpty(data)) _.merge(json, data)
        _.merge(json, { msg: print.format.call(this, msg, ...args) })
        text = JSON.stringify(json)
      } else {
        text = `[${dayjs(dt).utc(true).format(format)}] ${_.upperFirst(l)}: ${print.format.call(this, msg, ...args)}`
        // if (!_.isEmpty(data)) text += '\n  ' + (pretty.render(data, prettyOpts).split('\n').join('\n  '))
        if (!_.isEmpty(data)) text += '\n' + JSON.stringify(data)
      }
      const bajoLog = config.log.logger || 'bajoLogger'
      if (this[bajoLog] && this[bajoLog].logger) {
        this[bajoLog].logger[l](data, msg, ...args)
      } else console.log(text)
    }
  })
  return log
}
