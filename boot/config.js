const fs = require('fs-extra')
const _ = require('lodash')
const pathResolve = require('../helper/path-resolve')
const readConfig = require('../helper/read-config')
const error = require('../helper/error')
const logger = require('../lib/logger')
const mri = require('mri')

module.exports = async function () {
  const argv = mri(process.argv.slice(2), {
    boolean: ['dev', 'verbose'],
    string: ['data-dir', 'tmp-dir', 'trace'],
    alias: {
      d: 'data-dir',
      v: 'verbose'
    }
  })
  let env
  try {
    env = require('dotenv').config()
    if (env.error) throw env.error
  } catch (err) {}

  let config = {
    dir: {
      data: process.env.DATADIR || argv['data-dir'],
      tmp: process.env.TMPDIR || argv['tmp-dir'],
      lock: process.env.LOCKDIR || argv['lock-dir'],
      base: pathResolve.handler(process.cwd())
    },
    args: argv._,
    argv: _.omit(argv, ['_']),
  }

  if (_.isEmpty(config.dir.data)) throw error.handler('No data directory provided', { code: 'BAJO_DDIR_NOT_PROVIDED' })
  config.dir.data = pathResolve.handler(config.dir.data)
  if (!config.dir.tmp) config.dir.tmp = config.dir.data + '/tmp'
  if (!config.dir.lock) config.dir.lock = config.dir.data + '/lock'
  fs.ensureDirSync(config.dir.data + '/config')
  let resp = await readConfig.call(this, pathResolve.handler(`${config.dir.data}/config/bajo.*`))
  resp = _.omit(resp, ['dir', 'args', 'argv'])
  config = _.defaultsDeep(resp, config)
  config.bajos = config.bajos || ['app']
  config.dev = process.env.DEV || argv.dev || config.dev
  config.verbose = process.env.VERBOSE || argv.verbose || config.verbose
  process.env.NODE_ENV = config.dev ? 'development' : 'production'
  config.log = config.log || {}
  config.log.level = config.log.level || 'info'
  const oldDetails = _.clone(config.log.details)
  config.log.details = process.env.LOG_DETAILS || _.map((argv['log-details'] || '').split(','), t => _.trim(t))
  if (_.isEmpty(config.log.details)) config.details = oldDetails
  if (config.dev) config.log.level = 'debug'
  if (config.verbose) config.log.level = 'trace'

  if (!config.bajos.includes('app')) config.bajos.push('app')
  config.bajos = _.filter(_.uniq(_.map(config.bajos, b => _.trim(b))), b => !_.isEmpty(b))
  _.forOwn(config.dir, (v, k) => {
    config.dir[k] = pathResolve.handler(v)
    fs.ensureDirSync(config.dir[k])
  })
  this.bajo.config = config
  this.bajo.log = logger.call(this)
  this.bajo.event.emit('boot', ['bajoReadConfig', 'Read configuration: %s', 'debug', 'core'])
}
