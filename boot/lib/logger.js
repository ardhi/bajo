import os from 'os'
import { isEmpty, without, merge, upperFirst, isPlainObject } from 'lodash-es'
// import pretty from 'prettyjson'
import getPluginName from '../helper/get-plugin-name.js'
import levels from '../helper/log-levels.js'
import isLogInRange from '../helper/is-log-in-range.js'
import dayjs from 'dayjs'

/*
const prettyOpts = {
  noAlign: true,
  defaultIndentation: 2,
  renderUndefined: true
}
*/

class Log {
  constructor (scope) {
    this.scope = scope
    this.config = scope.bajo.config
    this.bajoLog = this.config.log.logger ?? 'bajoLogger'
    this.format = 'YYYY-MM-DDTHH:MM:ss.SSS[Z]'
  }

  isExtLogger () {
    return this.scope[this.bajoLog] && this.scope[this.bajoLog].logger
  }

  child () {
    if (this.isExtLogger()) return this.scope[this.bajoLog].logger.child()
    return this.scope
  }

  formatMsg (level, params) {
    const { print } = this.scope.bajo.helper
    let opts = {}
    if (isPlainObject(params.slice(-1)[0])) opts = params.pop()
    if (this.config.log.level === 'silent') return
    if (!isLogInRange.call(this.scope, level)) return
    let [data, msg, ...args] = params
    if (typeof data === 'string') {
      args.unshift(msg)
      msg = data
      data = null
    }
    args = without(args, undefined)
    const pkg = opts.pkg ?? getPluginName.call(this.scope, 3)
    msg = print.__(`[%s] ${msg}`, pkg, ...args)
    if (this.scope[this.bajoLog] && this.scope[this.bajoLog].logger) {
      this.scope[this.bajoLog].logger[level](data, msg, ...args)
    } else {
      let text
      const dt = new Date()
      if (this.config.env === 'prod') {
        const json = { level: levels[level], time: dt.valueOf(), pid: process.pid, hostname: os.hostname() }
        if (!isEmpty(data)) merge(json, data)
        merge(json, { msg })
        text = JSON.stringify(json)
      } else {
        text = `[${dayjs(dt).utc(true).format(this.format)}] ${upperFirst(level)}: ${msg}`
        // if (!isEmpty(data)) text += '\n  ' + (pretty.render(data, prettyOpts).split('\n').join('\n  '))
        if (!isEmpty(data)) text += '\n' + JSON.stringify(data)
      }
      console.log(text)
    }
  }
}

Object.keys(levels).forEach(level => {
  Log.prototype[level] = function (...params) {
    this.formatMsg(level, params)
  }
})

export default function logger () {
  return new Log(this)
}
