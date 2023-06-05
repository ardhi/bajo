const buildHelper = require('../lib/build-helper')
const _ = require('lodash')
const fs = require('fs-extra')
const fastGlob = require('fast-glob')
const outmatch = require('outmatch')
const semver = require('semver')
const lockfile = require('proper-lockfile')

module.exports = async function () {
  this.bajo.helper = await buildHelper.call(this, `${__dirname}/../helper`)
  _.extend(this.bajo.helper, { _, fastGlob, fs, outmatch, lockfile, semver })
  this.bajo.event.emit('boot', ['bajoHelper', 'Attach function helpers: %s', 'debug', 'core'])
  // get from bajos
  for (const b of this.bajo.config.bajos) {
    const dir = b === 'app' ? (this.bajo.config.dir.base + '/app') : this.bajo.helper.getModuleDir(b)
    const name = _.camelCase(b)
    if (!this[name]) this[name] = {}
    this[name].helper = await buildHelper.call(this, `${dir}/bajo/helper`, { pkg: name })
    this.bajo.event.emit('boot', ['bajoHelper', `Attach function helpers: %s`, 'debug', name])
  }
}
