import { get, isEmpty, cloneDeep, omit, isPlainObject, camelCase } from 'lodash-es'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'
import Log from './log.js'
import Print from './print.js'
import BajoError from './error.js'

class Plugin {
  constructor (pkgName, app) {
    this.pkgName = pkgName
    this.name = camelCase(pkgName)
    this.app = app
    this.config = {}
    this.lib = {}
    this.exitHandler = undefined
    this.initLog()
  }

  getConfig (path, options = {}) {
    let obj = isEmpty(path) ? this.config : get(this.config, path, options.defValue)
    options.omit = options.omit ?? omittedPluginKeys
    if (isPlainObject(obj) && !isEmpty(options.omit)) obj = omit(obj, options.omit)
    if (!options.noclone) obj = cloneDeep(obj)
    return obj
  }

  initLog () {
    this.log = new Log(this)
  }

  initPrint (opts) {
    this.print = new Print(this, opts)
  }

  error (msg, ...args) {
    if (!this.print) return new Error(msg, ...args)
    const error = new BajoError(this, msg, ...args)
    return error.write()
  }

  fatal (msg, ...args) {
    let e
    if (this.print) {
      const error = new BajoError(this, msg, ...args)
      e = error.write(true)
    } else e = new Error(msg, ...args)
    console.error(e)
    process.kill(process.pid, 'SIGINT')
  }
}

export default Plugin
