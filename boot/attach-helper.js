import buildHelper from './lib/build-helper.js'
import logger from './lib/logger.js'
import _ from 'lodash'
import fs from 'fs-extra'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import deepFreeze from 'deep-freeze-strict'
import __ from './helper/__.js'

dayjs.extend(utc)

export default async function () {
  this.bajo.helper = await buildHelper.call(this, `${__(import.meta).dir}/helper`)
  this.bajo.helper.__ = __
  this.bajo.helper.freeze = (o, shallow) => {
    if (shallow) Object.freeze(o)
    else deepFreeze(o)
  }
  this.bajo.helper.log = logger.call(this)
  this.bajo.helper.freeze(this.bajo.helper, true)
  // last cleanup
  if (!fs.existsSync(this.bajo.config.dir.data))
    this.bajo.helper.log.warn(`Data directory '%s' is not set yet!`, this.bajo.config.dir.data)
}
