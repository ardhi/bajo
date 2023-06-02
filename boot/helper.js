const buildHelper = require('../lib/build-helper')
const _ = require('lodash')
const fs = require('fs-extra')
const fastGlob = require('fast-glob')
const outmatch = require('outmatch')

module.exports = async function () {
  this.bajo.helper = await buildHelper.call(this, `${__dirname}/../helper`)
  _.extend(this.bajo.helper, { _, fastGlob, fs, outmatch })
  // get from bajos
  for (const b of this.bajo.config.bajos) {
    const dir = b === 'app' ? (this.bajo.config.dir.base + '/app') : this.helper.getModuleDir(b)
    const name = _.camelCase(b)
    if (!this[name]) this[name] = {}
    this[name].helper = await buildHelper.call(this, `${dir}/bajo/helper`)
  }
}
