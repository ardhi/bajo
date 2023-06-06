const buildHelper = require('../lib/build-helper')
const _ = require('lodash')
const fs = require('fs-extra')
const fastGlob = require('fast-glob')
const outmatch = require('outmatch')
const semver = require('semver')
const lockfile = require('proper-lockfile')
const dateformat = require('dateformat')
const deepFreeze = require('deep-freeze-strict')

module.exports = async function () {
  this.bajo.helper = await buildHelper.call(this, `${__dirname}/../helper`)
  const freeze = (o, shallow) => {
    if (shallow) Object.freeze(o)
    else deepFreeze(o)
  }
  _.extend(this.bajo.helper, { _, fastGlob, fs, outmatch, lockfile, semver, dateformat, freeze })
  freeze(this.bajo.helper, true)
  this.bajo.event.emit('boot', ['bajoHelper', 'Attach function helpers: %s', 'debug', 'core'])
  // get from bajos
  for (const b of this.bajo.config.bajos) {
    const dir = b === 'app' ? (this.bajo.config.dir.base + '/app') : this.bajo.helper.getModuleDir(b)
    const name = _.camelCase(b)
    if (!this[name]) this[name] = {}
    this[name].helper = await buildHelper.call(this, `${dir}/bajo/helper`, { pkg: name })
    freeze(this[name].helper, true)
    this.bajo.event.emit('boot', ['bajoHelper', 'Attach function helpers: %s', 'debug', name])
  }
}
