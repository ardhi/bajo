import createMethod from '../../lib/create-method.js'
import deepFreeze from 'deep-freeze-strict'
import currentLoc from '../core-method/current-loc.js'
import fs from 'fs-extra'
import fastGlob from 'fast-glob'
import { sprintf } from 'sprintf-js'
import outmatch from 'outmatch'

export default async function () {
  await createMethod.call(this.bajo, `${currentLoc(import.meta).dir}/../core-method`)
  this.bajo.freeze = (o, shallow) => {
    if (shallow) Object.freeze(o)
    else deepFreeze(o)
  }
  this.bajo.setImmediate = function () {
    return new Promise((resolve) => {
      setImmediate(() => resolve())
    })
  }
  // commonly used libraries
  this.bajo.lib._ = await import('lodash-es')
  this.bajo.lib.fs = fs
  this.bajo.lib.fastGlob = fastGlob
  this.bajo.lib.sprintf = sprintf
  this.bajo.lib.outmatch = outmatch
  // last cleanup
  if (!fs.existsSync(this.bajo.config.dir.data)) {
    this.bajo.log.warn('Data directory \'%s\' doesn\'t exists!', this.bajo.config.dir.data)
  }
}
