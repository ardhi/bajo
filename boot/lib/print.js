import Sprintf from 'sprintf-js'
import ora from 'ora'
import { isPlainObject, get } from 'lodash-es'
import defaultsDeep from '../core/method/defaults-deep.js'

const { sprintf } = Sprintf

export class Print {
  constructor (opts = {}) {
    this.opts = opts
    this.startTime = undefined
    this.plugin = undefined
  }

  setOpts (args = []) {
    const config = this.plugin.app.bajo.config
    let opts = {}
    if (isPlainObject(args.slice(-1)[0])) opts = args.pop()
    this.opts.isSilent = !!(config.silent || this.opts.isSilent)
    this.opts = defaultsDeep(opts, this.opts)
  }

  setPlugin (plugin) {
    this.plugin = plugin
    this.startTime = this.plugin.app.bajo.dayjs()
    this.setOpts()
    this.ora = ora(this.opts)
  }

  setText (text, ...args) {
    text = this.__(text, ...args)
    this.setOpts(args)
    const prefixes = []
    const texts = []
    if (this.opts.showDatetime) prefixes.push('[' + this.plugin.app.bajo.dayjs().toISOString() + ']')
    if (this.opts.showCounter) texts.push('[' + this.getElapsed() + ']')
    if (prefixes.length > 0) this.ora.prefixText = this.ora.prefixText + prefixes.join(' ')
    if (texts.length > 0) text = texts.join(' ') + ' ' + text
    this.ora.text = text
    return this
  }

  __ (text, ...args) {
    if (text) {
      const i18n = get(this, 'plugin.app.bajoI18N.instance')
      if (i18n) {
        if (isPlainObject(args[0])) text = i18n.t(text, args[0])
        else text = i18n.t(text, { ns: this.ns, postProcess: 'sprintf', sprintf: args })
      } else text = sprintf(text, ...args)
    }
    return text
  }

  getElapsed (unit = 'hms') {
    const u = unit === 'hms' ? 'second' : unit
    const elapsed = this.plugin.app.bajo.dayjs().diff(this.startTime, u)
    return unit === 'hms' ? this.plugin.app.bajo.secToHms(elapsed) : elapsed
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
  print.setPlugin(this)
  return print
}
