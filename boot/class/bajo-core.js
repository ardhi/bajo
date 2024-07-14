import BasePlugin from './base-plugin.js'
import dayjs from '../lib/dayjs.js'
import importModule from './bajo-core/method/import-module.js'
import readJson from './bajo-core/method/read-json.js'

import { isFunction } from 'lodash-es'

async function defConfigHandler (file) {
  let mod = await importModule(file)
  if (isFunction(mod)) mod = await mod.call(this)
  return mod
}

class BajoCore extends BasePlugin {
  constructor (app) {
    super('bajo', app)
    this.runAt = new Date()
    this.mainNs = 'main'
    this.lib.dayjs = dayjs
    this.configHandlers = [
      { ext: '.js', readHandler: defConfigHandler },
      { ext: '.json', readHandler: readJson }
    ]
  }
}

export default BajoCore
