const buildHelper = require('../lib/build-helper')
const logger = require('../lib/logger')
const _ = require('lodash')
const fs = require('fs-extra')
const fastGlob = require('fast-glob')
const outmatch = require('outmatch')
const semver = require('semver')
const lockfile = require('proper-lockfile')
const dateformat = require('dateformat')
const deepFreeze = require('deep-freeze-strict')
const callsites = require('callsites')
const flatten = require('flat')
const unflatten = require('flat').unflatten

module.exports = async function () {
  this.bajo.helper = await buildHelper.call(this, `${__dirname}/../helper`)
  const freeze = (o, shallow) => {
    if (shallow) Object.freeze(o)
    else deepFreeze(o)
  }
  const log = logger.call(this)
  _.extend(this.bajo.helper, { log, _, fastGlob, fs, outmatch, lockfile, semver, dateformat,
    freeze, callsites, flatten, unflatten })

  freeze(this.bajo.helper, true)
}
