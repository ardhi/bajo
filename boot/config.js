const fs = require('fs-extra')
const _ = require('lodash')
const pathResolve = require('../helper/path-resolve')
const readConfig = require('../helper/read-config')
const error = require('../helper/error')
const util = require('util')
const mri = require('mri')

function logger () {
  const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
  const log = {}
  _.each(levels, l => {
    log[l] = (...params) => {
      const config = this.bajo.config
      const logLevel = _.indexOf(levels, config.logLevel)
      if (!(_.indexOf(levels, l) >= logLevel)) return
      let [data, msg, ...args] = params
      if (_.isString(data)) {
        args.unshift(msg)
        msg = data
      }
      args = _.without(args, undefined)
      console.log(`${_.upperFirst(l)}: ${util.format(msg, ...args)}`)
    }
  })
  return log
}

const argv = mri(process.argv.slice(2), {
  boolean: ['dev', 'print-routes', 'print-plugins', 'verbose'],
  string: ['data-dir', 'tmp-dir'],
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
  bajos: ['app'],
  dev: process.env.DEV || argv.dev,
  verbose: process.env.VERBOSE || argv.verbose,
  args: argv._,
  argv: _.omit(argv, ['_'])
}
config.logLevel = config.dev ? 'debug' : 'info'
if (config.verbose) config.logLevel = 'trace'
process.env.NODE_ENV = config.dev ? 'development' : 'production'

module.exports = async function () {
  if (_.isEmpty(config.dir.data)) throw error.handler('No data directory provided', { code: 'BAJO_DDIR_NOT_PROVIDED' })
  config.dir.data = pathResolve.handler(config.dir.data)
  if (!config.dir.tmp) config.dir.tmp = config.dir.data + '/tmp'
  if (!config.dir.lock) config.dir.lock = config.dir.data + '/lock'
  fs.ensureDirSync(config.dir.data + '/config')
  let resp = await readConfig.call(this, pathResolve.handler(`${config.dir.data}/config/bajo.*`))
  resp = _.omit(resp, ['dir', 'args', 'argv'])
  config = _.defaultsDeep(resp, config)
  if (!config.bajos.includes('app')) config.bajos.push('app')
  config.bajos = _.filter(_.uniq(_.map(config.bajos, b => _.trim(b))), b => !_.isEmpty(b))
  _.forOwn(config.dir, (v, k) => {
    config.dir[k] = pathResolve.handler(v)
    fs.ensureDirSync(config.dir[k])
  })
  this.bajo.config = config
  this.bajo.log = logger.call(this)
  this.bajo.event.emit('boot', ['Read configuration: core', 'bajoReadConfig'])
}
