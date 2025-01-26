import Plugin from './plugin.js'
import dayjs from '../lib/dayjs.js'
import importModule from './bajo-core/method/import-module.js'
import readJson from './bajo-core/method/read-json.js'

import lodash from 'lodash'
const { isFunction } = lodash

async function defConfigHandler (file, opts) {
  let mod = await importModule(file)
  if (isFunction(mod)) mod = await mod.call(this, opts)
  return mod
}

class BajoCore extends Plugin {
  constructor (app) {
    super('bajo', app)
    this.runAt = new Date()
    this.mainNs = 'main'
    this.lib.dayjs = dayjs
    this.applets = []
    this.pluginPkgs = []
    this.pluginNames = []
    this.configHandlers = [
      { ext: '.js', readHandler: defConfigHandler },
      { ext: '.json', readHandler: readJson }
    ]
  }
}

export default BajoCore
