import ora from 'ora'
import { isPlainObject } from 'lodash-es'
import defaultsDeep from './bajo-core/method/defaults-deep.js'
import translate from '../lib/translate.js'

class Print {
  constructor (plugin, opts = {}) {
    this.opts = opts
    this.plugin = plugin
    this.startTime = this.plugin.app.bajo.lib.dayjs()
    this.setOpts()
    this.ora = ora(this.opts)
  }

  setOpts (args = []) {
    const config = this.plugin.app.bajo.config
    let opts = {}
    if (isPlainObject(args.slice(-1)[0])) opts = args.pop()
    this.opts.isSilent = !!(config.silent || this.opts.isSilent)
    this.opts = defaultsDeep(opts, this.opts)
  }

  setText (text, ...args) {
    text = this.write(text, ...args)
    this.setOpts(args)
    const prefixes = []
    const texts = []
    if (this.opts.showDatetime) prefixes.push('[' + this.plugin.app.bajo.lib.dayjs().toISOString() + ']')
    if (this.opts.showCounter) texts.push('[' + this.getElapsed() + ']')
    if (prefixes.length > 0) this.ora.prefixText = this.ora.prefixText + prefixes.join(' ')
    if (texts.length > 0) text = texts.join(' ') + ' ' + text
    this.ora.text = text
    return this
  }

  write (text, ...args) {
    return translate.call(this.plugin, null, text, ...args)
  }

  getElapsed (unit = 'hms') {
    const u = unit === 'hms' ? 'second' : unit
    const elapsed = this.plugin.app.bajo.lib.dayjs().diff(this.startTime, u)
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

  spinner () {
    return new Print(this.plugin)
  }
}

export default Print
