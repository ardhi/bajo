import buildHelper from '../lib/build-helper.js'
import logger from '../lib/logger.js'
import _ from 'lodash'
import fs from 'fs-extra'
import fastGlob from 'fast-glob'
import outmatch from 'outmatch'
import semver from 'semver'
import lockfile from 'proper-lockfile'
import dateFormat from 'dateformat'
import deepFreeze from 'deep-freeze-strict'
import callsites from 'callsites'
import flatten from 'flat'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const { unflatten } = flatten

export default async function () {
  this.bajo.helper = await buildHelper.call(this, `${__dirname}/../helper`)
  const freeze = (o, shallow) => {
    if (shallow) Object.freeze(o)
    else deepFreeze(o)
  }
  const log = logger.call(this)
  _.extend(this.bajo.helper, { log, _, fastGlob, fs, outmatch, lockfile, semver, dateFormat,
    freeze, callsites, flatten, unflatten })

  freeze(this.bajo.helper, true)
}
