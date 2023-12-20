import Sprintf from 'sprintf-js'
import ora from 'ora'
import { last, isPlainObject, get, isString } from 'lodash-es'

const { sprintf } = Sprintf

class Bora {
  constructor (ns, ...args) {
    this.ns = ns
    let opts = {}
    if (isPlainObject(args.slice(-1)[0])) opts = args.pop()
    this.opts = opts
    this.opts.isSilent = !!this.opts.isSilent
    this.ora = ora(this.opts)
    this.args = args
    this.startTime = null
  }

  setScope (scope) {
    this.scope = scope
    const { getConfig, dayjs } = this.scope.bajo.helper
    this.startTime = dayjs()
    const config = getConfig()
    this.ora.isSilent = !!config.silent || this.opts.isSilent
    const [text, ...params] = this.args
    this.setText(text, ...params)
  }

  setText (text, ...args) {
    const { dayjs } = this.scope.bajo.helper
    if (isString(text)) {
      const i18n = get(this, 'scope.bajoI18N.instance')
      if (i18n) {
        if (isPlainObject(args[0])) text = i18n.t(text, args[0])
        else text = i18n.t(text, { ns: this.ns, postProcess: 'sprintf', sprintf: args })
      } else text = sprintf(text, ...args)
      this.ora.text = text
      let opts = last(args)
      const prefixes = []
      const texts = []
      if (!isPlainObject(opts)) opts = {}
      if (this.opts.showDatetime || opts.showDatetime) prefixes.push('[' + dayjs().toISOString() + ']')
      if (this.opts.showCounter || opts.showCounter) texts.push('[' + this.getElapsed() + ']')
      if (prefixes.length > 0) this.ora.prefixText = this.ora.prefixText + prefixes.join(' ')
      if (texts.length > 0) this.ora.text = texts.join(' ') + ' ' + text
    }
    return this
  }

  getElapsed (unit = 'hms') {
    const { dayjs, secToHms } = this.scope.bajo.helper
    const u = unit === 'hms' ? 'second' : unit
    const elapsed = dayjs().diff(this.startTime, u)
    return unit === 'hms' ? secToHms(elapsed) : elapsed
  }

  start (text, ...args) {
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
    process.exit(1)
  }
}

export default function (ns, ...args) {
  const bora = new Bora(ns, ...args)
  bora.setScope(this)
  return bora
}
