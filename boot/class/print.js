import ora from 'ora'
import lodash from 'lodash'
import defaultsDeep from './bajo-core/method/defaults-deep.js'
import fs from 'fs-extra'
import Sprintf from 'sprintf-js'
const { sprintf } = Sprintf
let unknownLangWarning = false

const { last, isPlainObject, get, without, reverse } = lodash

class Print {
  constructor (plugin, opts = {}) {
    this.opts = opts
    this.plugin = plugin
    this.startTime = this.plugin.app.bajo.lib.dayjs()
    this.setOpts()
    this.ora = ora(this.opts)
    this.intl = {}
  }

  init () {
    for (const l of this.plugin.app.bajo.config.intl.supported) {
      this.intl[l] = {}
      const path = `${this.plugin.dir.pkg}/bajo/intl/${l}.json`
      if (!fs.existsSync(path)) continue
      const trans = fs.readFileSync(path, 'utf8')
      try {
        this.intl[l] = JSON.parse(trans)
      } catch (err) {}
    }
  }

  write (text, ...args) {
    const opts = last(args)
    let lang = this.plugin.app.bajo.config.lang
    if (isPlainObject(opts)) {
      args.pop()
      lang = opts.lang
    }
    const { fallback, supported } = this.plugin.app.bajo.config.intl
    if (!unknownLangWarning && !supported.includes(lang)) {
      unknownLangWarning = true
      this.plugin.app.bajo.log.warn('unsupportedLangFallbackTo%s', fallback)
    }
    const plugins = reverse(without([...this.plugin.app.bajo.pluginNames], this.plugin.name))
    plugins.unshift(this.plugin.name)
    plugins.push('bajo')

    let trans
    for (const p of plugins) {
      const root = get(this, `plugin.app.${p}.print.intl.${lang}`, {})
      trans = get(root, text)
      if (trans) break
    }
    if (!trans) {
      for (const p of plugins) {
        const root = get(this, `plugin.app.${p}.print.intl.${fallback}`, {})
        trans = get(root, text)
        if (trans) break
      }
    }
    if (!trans) trans = text
    return sprintf(trans, ...args)
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
