import Sprintf from 'sprintf-js'
import ora from 'ora'
import { last, isPlainObject, get, isString } from 'lodash-es'

const { sprintf } = Sprintf

class Bora {
  constructor (ns, ...args) {
    this.ns = ns
    const l = last(args)
    let opts = {}
    if (isPlainObject(l)) opts = args.pop()
    this.opts = opts
    this.ora = ora(this.opts)
    this.args = args
    this.startTime = null
  }

  setScope (scope) {
    this.scope = scope
    const { getConfig, dayjs } = this.scope.bajo.helper
    this.startTime = dayjs()
    const config = getConfig()
    let silent = !!config.silent
    if (this.opts.skipSilent) silent = false
    this.ora.isSilent = silent
    const [text, ...params] = this.args
    this.setText(text, ...params)
  }

  setText (text, ...args) {
    const { dayjs, secToHms } = this.scope.bajo.helper
    if (isString(text)) {
      const i18n = get(this, 'scope.bajoI18N.instance')
      if (i18n) {
        if (isPlainObject(args[0])) text = i18n.t(text, args[0])
        else text = i18n.t(text, { ns: this.ns, postProcess: 'sprintf', sprintf: args })
      } else text = sprintf(text, ...args)
      const elapsed = dayjs().diff(this.startTime, 'second')
      if (this.opts.showCounter) text = `[${secToHms(elapsed)}] ${text}`
      this.ora.text = text
    }
    return this
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
