import buildHelper from './lib/build-helper.js'
import logger from './lib/logger.js'
import _ from 'lodash'
import fs from 'fs-extra'
import fastGlob from 'fast-glob'
import outmatch from 'outmatch'
import semver from 'semver'
import lockfile from 'proper-lockfile'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import deepFreeze from 'deep-freeze-strict'
import callsites from 'callsites'
import flatten from 'flat'
import path from 'path'
import { fileURLToPath } from 'url'

dayjs.extend(utc)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default async function () {
  this.bajo.helper = await buildHelper.call(this, `${__dirname}/helper`)
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
