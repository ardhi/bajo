import createMethod from '../../../lib/create-method.js'
import deepFreeze from 'deep-freeze-strict'
import currentLoc from '../method/current-loc.js'
import fs from 'fs-extra'
import fastGlob from 'fast-glob'
import { sprintf } from 'sprintf-js'
import outmatch from 'outmatch'

export default async function () {
  await createMethod.call(this, `${currentLoc(import.meta).dir}/../method`)
  this.freeze = (o, shallow) => {
    if (shallow) Object.freeze(o)
    else deepFreeze(o)
  }
  this.setImmediate = function () {
    return new Promise((resolve) => {
      setImmediate(() => resolve())
    })
  }
  // commonly used libraries
  this.lib._ = await import('lodash-es')
  this.lib.fs = fs
  this.lib.fastGlob = fastGlob
  this.lib.sprintf = sprintf
  this.lib.outmatch = outmatch
  // last cleanup
  if (!fs.existsSync(this.dir.data)) {
    this.log.warn('Data directory \'%s\' doesn\'t exists!', this.dir.data)
  }
}
