import buildHelper from './lib/build-helper.js'
import logger from './lib/logger.js'
import print from './lib/print.js'
import fs from 'fs-extra'
import deepFreeze from 'deep-freeze-strict'
import currentLoc from './helper/current-loc.js'
import dayjs from './lib/dayjs.js'

export default async function () {
  this.bajo.helper = await buildHelper.call(this, `${currentLoc(import.meta).dir}/helper`)
  this.bajo.helper.freeze = (o, shallow) => {
    if (shallow) Object.freeze(o)
    else deepFreeze(o)
  }
  this.bajo.helper.dayjs = dayjs
  this.bajo.helper.print = print.call(this)
  this.bajo.helper.log = logger.call(this)
  this.bajo.helper.setImmediate = function () {
    return new Promise((resolve) => {
      setImmediate(() => resolve())
    })
  }
  this.bajo.helper.freeze(this.bajo.helper, true)
  // last cleanup
  if (!fs.existsSync(this.bajo.config.dir.data)) {
    this.bajo.helper.log.warn('Data directory \'%s\' is not set yet!', this.bajo.config.dir.data)
  }
  if (this.bajo.config.env === 'dev') {
    this.dump = this.bajo.helper.dump
  }
}
