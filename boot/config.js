const fs = require('fs-extra')
const _ = require('lodash')
const pathResolve = require('../helper/path-resolve')
const readConfig = require('../helper/read-config')
const mri = require('mri')
const pino = require('pino')

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
    base: pathResolve.handler(process.cwd())
  },
  log: {
    dev: {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true}
      }
    },
    prod: {}
  },
  bajos: ['app']
}
config.dev = process.env.dev || argv.dev
process.env.DEV = config.dev
process.env.NODE_ENV = config.dev ? 'development' : 'production'
config.args = argv._
config.argv = _.omit(argv, ['_'])
config.argv.verbose = process.env.VERBOSE || config.argv.verbose

module.exports = async function () {
  this.bajo.log = pino(config.dev ? config.log.dev : config.log.prod)
  if (_.isEmpty(config.dir.data)) throw new Error('noDataDirProvided')
  config.dir.data = pathResolve.handler(config.dir.data)
  if (!config.dir.tmp) config.dir.tmp = config.dir.data + '/tmp'
  fs.ensureDirSync(config.dir.data + '/config')
  let resp = await readConfig.call(this, pathResolve.handler(`${config.dir.data}/config/bajo.*`))
  resp = _.omit(resp, ['dir', 'args', 'argv'])
  config = _.defaultsDeep(resp, config)
  if (config.bajos[0] !== 'app') config.bajos.unshift('app')
  // reconfig pino
  this.bajo.log = pino(config.dev ? config.log.dev : config.log.prod)

  _.forOwn(config.dir, (v, k) => {
    config.dir[k] = pathResolve.handler(v)
    fs.ensureDirSync(config.dir[k])
  })
  this.bajo.config = config
}
