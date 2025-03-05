import lodash from 'lodash'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'
import Log from './log.js'
import Print from './print.js'
import BajoError from './error.js'

const { get, isEmpty, cloneDeep, omit, isPlainObject, camelCase } = lodash

class Plugin {
  constructor (pkgName, app) {
    this.pkgName = pkgName
    this.name = camelCase(pkgName)
    this.app = app
    this.config = {}
    this.lib = {}
    this.exitHandler = undefined
  }

  getConfig = (path, options = {}) => {
    let obj = isEmpty(path) ? this.config : get(this.config, path, options.defValue)
    options.omit = options.omit ?? omittedPluginKeys
    if (isPlainObject(obj) && !isEmpty(options.omit)) obj = omit(obj, options.omit)
    if (!options.noclone) obj = cloneDeep(obj)
    return obj
  }

  initLog = () => {
    this.log = new Log(this)
    this.log.init()
  }

  initPrint = (opts) => {
    this.print = new Print(this, opts)
    this.print.init()
  }

  error = (msg, ...args) => {
    if (!this.print) return new Error(msg, ...args)
    const error = new BajoError(this, msg, ...args)
    return error.write()
  }

  fatal = (msg, ...args) => {
    if (!this.print) return new Error(msg, ...args)
    const error = new BajoError(this, msg, ...args)
    return error.fatal()
  }
}

export default Plugin
