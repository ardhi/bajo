import buildHelper from '../lib/build-helper.js'
import print from '../lib/print.js'
import deepFreeze from 'deep-freeze-strict'
import currentLoc from './helper/current-loc.js'
import dayjs from '../lib/dayjs.js'
import fs from 'fs-extra'
import fastGlob from 'fast-glob'
import { sprintf } from 'sprintf-js'
import outmatch from 'outmatch'

export default async function () {
  this.bajo.helper = await buildHelper.call(this, `${currentLoc(import.meta).dir}/helper`)
  this.bajo.helper.freeze = (o, shallow) => {
    if (shallow) Object.freeze(o)
    else deepFreeze(o)
  }
  this.bajo.helper.dayjs = dayjs
  this.bajo.helper.print = print.call(this)
  this.bajo.helper.setImmediate = function () {
    return new Promise((resolve) => {
      setImmediate(() => resolve())
    })
  }
  // commonly used libraries
  this.bajo.helper._ = await import('lodash-es')
  this.bajo.helper.fs = fs
  this.bajo.helper.fastGlob = fastGlob
  this.bajo.helper.sprintf = sprintf
  this.bajo.helper.outmatch = outmatch
  // last cleanup
  this.bajo.helper.freeze(this.bajo.helper, true)
  if (!fs.existsSync(this.bajo.config.dir.data)) {
    this.bajo.helper.log.warn('Data directory \'%s\' is not set yet!', this.bajo.config.dir.data)
  }
}
