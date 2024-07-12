import { get, isEmpty, cloneDeep, omit, isPlainObject } from 'lodash-es'
import omittedPluginKeys from '../lib/omitted-plugin-keys.js'
import Log from './log.js'
import Print from './print.js'

class BasePlugin {
  constructor (name, app) {
    this.name = name
    this.app = app
    this.config = {}
    this.lib = {}
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
}

export default BasePlugin
