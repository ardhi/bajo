const fs = require('fs-extra')
const _ = require('lodash')
const pathResolve = require('../helper/path-resolve')
const readConfig = require('../helper/read-config')
const getKeyByValue = require('../helper/get-key-by-value')
const error = require('../helper/error')
const mri = require('mri')
const envs = require('../helper/envs')
const dotenvParseVariables = require('dotenv-parse-variables')
const unflatten = require('flat').unflatten

// get from argv
let argv = mri(process.argv.slice(2), {
  boolean: ['dev', 'verbose'],
  string: ['data-dir', 'tmp-dir', 'log-details'],
  alias: {
    d: 'data-dir',
    v: 'verbose'
  }
})
const args = argv._
delete argv._
argv = unflatten(argv, { delimiter: '-', safe: true, overwrite: true })

// get from env
let env
try {
  env = require('dotenv').config()
  if (env.error) throw env.error
} catch (err) {
  env = { parsed: {} }
}
env = dotenvParseVariables(env.parsed, { assignToProcessEnv: false })
env = unflatten(env, { delimiter: '_', safe: true, overwrite: true, transformKey: k => k.toLowerCase() })

module.exports = async function () {
  let defConfig = {
    dir: {},
    log: {
      level: 'info',
      dateFormat: `UTC:yyyy-mm-dd'T'HH:MM:ss.l'Z'`,
      report: ['sysreport', 'helper', 'hook'],
      details: []
    },
    bajos: ['app'],
    env: 'dev'
  }
  defConfig = _.defaultsDeep(env, argv, defConfig)
  if (!defConfig.dir.data) throw error.handler('No data directory provided', { code: 'BAJO_DDIR_NOT_PROVIDED' })
  defConfig.dir.data = pathResolve.handler(defConfig.dir.data)
  _.set(defConfig, 'dir.base', pathResolve.handler(process.cwd()))
  _.each(['tmp', 'lock'], k => {
    if (!defConfig.dir[k]) defConfig.dir[k] = `${defConfig.dir.data}/${k}`
    fs.ensureDirSync(defConfig.dir[k])
  })
  fs.ensureDirSync(defConfig.dir.data + '/config')
  const resp = _.omit(await readConfig.call(this, `${defConfig.dir.data}/config/bajo.*`), ['dir'])
  const config = _.defaultsDeep(resp, defConfig)
  config.args = args
  config.env = config.env.toLowerCase()
  if (_.values(envs).includes(config.env)) config.env = getKeyByValue.handler(envs, config.env)
  if (!_.keys(envs).includes(config.env)) config.env = 'dev'
  process.env.NODE_ENV = envs[config.env]
  if (_.isString(config.log.details)) config.log.details = _.map((argv['log-details'] || '').split(','), t => _.trim(t))
  if (config.env === 'dev') config.log.level = 'debug'
  if (config.verbose) config.log.level = 'trace'

  if (!config.bajos.includes('app')) config.bajos.push('app')
  config.bajos = _.filter(_.uniq(_.map(config.bajos, b => _.trim(b))), b => !_.isEmpty(b))
  this.bajo.config = config
  console.log(config)
}
