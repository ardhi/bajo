import createMethod from '../lib/create-method.js'
import print from '../lib/print.js'
import deepFreeze from 'deep-freeze-strict'
import currentLoc from './method/current-loc.js'
import dayjs from '../lib/dayjs.js'
import fs from 'fs-extra'
import fastGlob from 'fast-glob'
import { sprintf } from 'sprintf-js'
import outmatch from 'outmatch'

export default async function () {
  await createMethod.call(this.bajo, `${currentLoc(import.meta).dir}/method`)
  this.bajo.freeze = (o, shallow) => {
    if (shallow) Object.freeze(o)
    else deepFreeze(o)
  }
  this.bajo.dayjs = dayjs
  this.bajo.print = print.call(this.bajo)
  this.bajo.setImmediate = function () {
    return new Promise((resolve) => {
      setImmediate(() => resolve())
    })
  }
  // commonly used libraries
  this.bajo.lib = {
    _: await import('lodash-es'),
    fs,
    fastGlob,
    sprintf,
    outmatch
  }
  // last cleanup
  if (!fs.existsSync(this.bajo.config.dir.data)) {
    this.bajo.log.warn('Data directory \'%s\' doesn\'t exists!', this.bajo.config.dir.data)
  }
}
