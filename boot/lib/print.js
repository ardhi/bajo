import bora from './bora.js'
import Sprintf from 'sprintf-js'
import { isPlainObject, get, isEmpty } from 'lodash-es'
import defaultsDeep from '../helper/defaults-deep.js'
import getPluginName from '../helper/get-plugin-name.js'

const { sprintf } = Sprintf

class Print {
  constructor (scope) {
    this.scope = scope
  }

  _prep (params) {
    const [msg, ...args] = params
    let opts = {}
    if (isPlainObject(args.slice(-1)[0])) opts = args.pop()
    opts = defaultsDeep(opts, { type: 'bora', exit: false, skipSilent: false })
    this.opts = opts
    this.opts.ns = this.opts.ns ?? ['bajoI18N']
    this.opts.pkg = this.opts.pkg ?? getPluginName.call(this.scope, 2)
    this.args = args
    this.msg = msg
  }

  formatMsg (params) {
    this._prep(params)
    if (isEmpty(this.msg)) return ''
    const transHandler = get(this, 'scope.bajo.transHandler')
    const dayjs = get(this, 'scope.bajo.helper')
    if (transHandler) this.msg = transHandler.call(this, { msg: this.msg, params: this.args, options: this.opts })
    else this.msg = sprintf(this.msg, ...this.args)
    if (this.opts.showDatetime && dayjs) this.msg = `[${dayjs().toISOString()}] ${this.msg}`
    return this.msg
  }

  __ (...params) {
    return this.formatMsg(params)
  }

  output (params, boraMethod = 'succeed', logMethod = 'info', consoleMethod = 'log') {
    this.formatMsg(params)
    if (isEmpty(this.msg)) return ''
    switch (this.opts.type) {
      case 'bora': bora.call(this.scope, this.opts.ns, this.opts)[boraMethod](this.msg, ...this.args); break
      case 'log': this.scope.bajo.helper.log[logMethod](this.msg, ...this.args, this.opts); break
      default: console[consoleMethod](this.msg)
    }
    if (this.opts.exit) process.exit()
  }

  fail (...params) {
    this.output(params, 'fail', 'error', 'error')
  }

  succeed (...params) {
    this.output(params, 'succeed', 'info')
  }

  warn (...params) {
    this.output(params, 'warn', 'warn')
  }

  info (...params) {
    this.output(params, 'info')
  }

  fatal (...params) {
    this.output(params, 'fatal', 'error', 'error')
    process.exit(1)
  }

  bora (...params) {
    let ns = getPluginName.call(this.scope, 2)
    if (ns === 'bajo') ns = 'bajoI18N'
    return bora.call(this.scope, ns, ...params)
  }
}

export default function () {
  return new Print(this)
}
