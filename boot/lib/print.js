import Sprintf from 'sprintf-js'
import ora from 'ora'
import { isPlainObject, get } from 'lodash-es'
import defaultsDeep from '../core/helper/defaults-deep.js'

const { sprintf } = Sprintf

export class Print {
  constructor (opts = {}) {
    this.opts = opts
    this.startTime = null
  }

  setOpts (args = []) {
    const config = this.scope.bajo.config
    let opts = {}
    if (isPlainObject(args.slice(-1)[0])) opts = args.pop()
    this.opts.isSilent = !!(config.silent || this.opts.isSilent)
    this.opts = defaultsDeep(opts, this.opts)
  }

  setScope (scope) {
    this.scope = scope
    const { dayjs } = this.scope.bajo.helper
    this.startTime = dayjs()
    this.setOpts()
    this.ora = ora(this.opts)
  }

  setText (text, ...args) {
    const { dayjs } = this.scope.bajo.helper
    text = this.__(text, ...args)
    this.setOpts(args)
    const prefixes = []
    const texts = []
    if (this.opts.showDatetime) prefixes.push('[' + dayjs().toISOString() + ']')
    if (this.opts.showCounter) texts.push('[' + this.getElapsed() + ']')
    if (prefixes.length > 0) this.ora.prefixText = this.ora.prefixText + prefixes.join(' ')
    if (texts.length > 0) text = texts.join(' ') + ' ' + text
    this.ora.text = text
    return this
  }

  __ (text, ...args) {
    if (text) {
      const i18n = get(this, 'scope.bajoI18N.instance')
      if (i18n) {
        if (isPlainObject(args[0])) text = i18n.t(text, args[0])
        else text = i18n.t(text, { ns: this.ns, postProcess: 'sprintf', sprintf: args })
      } else text = sprintf(text, ...args)
    }
    return text
  }

  getElapsed (unit = 'hms') {
    const { dayjs, secToHms } = this.scope.bajo.helper
    const u = unit === 'hms' ? 'second' : unit
    const elapsed = dayjs().diff(this.startTime, u)
    return unit === 'hms' ? secToHms(elapsed) : elapsed
  }

  start (text, ...args) {
    this.setOpts(args)
    this.setText(text, ...args)
    this.ora.start()
    return this
  }

  stop () {
    this.ora.stop()
    return this
  }

  succeed (text, ...args) {
    this.setText(text, ...args)
    this.ora.succeed()
    return this
  }

  fail (text, ...args) {
    this.setText(text, ...args)
    this.ora.fail()
    return this
  }

  warn (text, ...args) {
    this.setText(text, ...args)
    this.ora.warn()
    return this
  }

  info (text, ...args) {
    this.setText(text, ...args)
    this.ora.info()
    return this
  }

  clear () {
    this.ora.clear()
    return this
  }

  render () {
    this.ora.render()
    return this
  }

  fatal (text, ...args) {
    this.setText(text, ...args)
    this.ora.fail()
    process.kill(process.pid, 'SIGINT')
  }
}

export default function (options) {
  const print = new Print(options)
  print.setScope(this)
  return print
}
