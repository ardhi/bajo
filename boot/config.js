const fs = require('fs-extra')
const _ = require('lodash')
const pathResolve = require('../helper/path-resolve')
const readConfig = require('../helper/read-config')
const getKeyByValue = require('../helper/get-key-by-value')
const error = require('../helper/error')
const mri = require('mri')
const envs = require('../helper/envs')
const dotenvParseVariables = require('dotenv-parse-variables')

module.exports = async function () {
  const argv = mri(process.argv.slice(2), {
    boolean: ['dev', 'verbose'],
    string: ['data-dir', 'tmp-dir', 'log-details'],
    alias: {
      d: 'data-dir',
      v: 'verbose'
    }
  })
  let env
  try {
    env = require('dotenv').config()
    if (env.error) throw env.error
  } catch (err) {
    env = { parsed: {} }
  }
  env = dotenvParseVariables(env.parsed)
  process.env = _.defaultsDeep(_.cloneDeep(env), process.env)

  let config = {
    dir: {
      data: env.DATADIR || argv['data-dir'],
      tmp: env.TMPDIR || argv['tmp-dir'],
      lock: env.LOCKDIR || argv['lock-dir'],
      base: pathResolve.handler(process.cwd())
    },
    args: argv._,
    argv: dotenvParseVariables(_.omit(argv, ['_']), {
      assignToProcessEnv: false,
      overrideProcessEnv: false
    }),
    log: {
      level: 'info',
      dateFormat: `UTC:yyyy-mm-dd'T'HH:MM:ss.l'Z'`,
      report: ['sysreport', 'helper', 'hook']
    }
  }

  if (_.isEmpty(config.dir.data)) throw error.handler('No data directory provided', { code: 'BAJO_DDIR_NOT_PROVIDED' })
  config.dir.data = pathResolve.handler(config.dir.data)
  if (!config.dir.tmp) config.dir.tmp = config.dir.data + '/tmp'
  if (!config.dir.lock) config.dir.lock = config.dir.data + '/lock'
  fs.ensureDirSync(config.dir.data + '/config')
  let resp = await readConfig.call(this, `${config.dir.data}/config/bajo.*`)
  resp = _.omit(resp, ['dir', 'args', 'argv'])
  config = _.defaultsDeep(resp, config)
  config.bajos = config.bajos || ['app']
  config.env = process.env.ENV || argv.env || config.env || 'dev'
  config.env = config.env.toLowerCase()
  if (_.values(envs).includes(config.env)) config.env = getKeyByValue.handler(envs, config.env)
  if (!_.keys(envs).includes(config.env)) config.env = 'dev'
  config.verbose = process.env.VERBOSE || argv.verbose || config.verbose
  process.env.NODE_ENV = envs[config.env]
  const oldDetails = _.clone(config.log.details)
  config.log.details = process.env.LOG_DETAILS || _.map((argv['log-details'] || '').split(','), t => _.trim(t))
  if (_.isEmpty(config.log.details)) config.details = oldDetails
  if (config.env === 'dev') config.log.level = 'debug'
  if (config.verbose) config.log.level = 'trace'

  if (!config.bajos.includes('app')) config.bajos.push('app')
  config.bajos = _.filter(_.uniq(_.map(config.bajos, b => _.trim(b))), b => !_.isEmpty(b))
  _.forOwn(config.dir, (v, k) => {
    config.dir[k] = pathResolve.handler(v)
    fs.ensureDirSync(config.dir[k])
  })
  this.bajo.config = config
}
