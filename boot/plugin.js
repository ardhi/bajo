import { get, isEmpty, cloneDeep, omit } from 'lodash-es'
import omittedPluginKeys from './lib/omitted-plugin-keys.js'
import Log from './lib/log.js'

class Plugin {
  constructor (name, app) {
    this.name = name
    this.app = app
    this.config = {}
    this.log = new Log(this)
  }

  getConfig (path, { full, clone } = {}) {
    let obj = get(this.config, path)
    if (isEmpty(path) && !full) obj = omit(obj, omittedPluginKeys)
    if (clone) obj = cloneDeep(obj)
    return obj
  }
}

export default Plugin
