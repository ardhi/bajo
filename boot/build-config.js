/**
 * @module boot/buildConfig
 */

import fs from 'fs-extra'
import _ from 'lodash'
import pathResolve from '../helper/path-resolve.js'
import readConfig from '../helper/read-config.js'
import getKeyByValue from '../helper/get-key-by-value.js'
import error from '../helper/error.js'
import envs from '../helper/envs.js'
import parseArgsArgv from '../lib/parse-args-argv.js'
import parseEnv from '../lib/parse-env.js'

/**
 * Building configuration object. Read configurtion file from app data directory, program
 * arguments and envoronment variables with following priority: ```Env > Args > Config file >
 * defaults config```
 *
 * If data directory is provided and doesn't exist yet, it will be automatically created.
 *
 * Config file must be located in: ```<data dir>/config/bajo.<format>```, and support either
 * ```.json``` or ```.js``` format. JS format must be a nodejs module that wrap an async
 * function and return an object
 *
 * @instance
 * @async
 * @throws Will throw if data directory is not provided
 *
 * @returns {Object} config
 */

async function buildConfig () {
  const { args, argv } = parseArgsArgv()
  const env = parseEnv()
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
  defConfig = _.defaultsDeep(env.root, argv.root, defConfig)
  if (!defConfig.dir.data) throw error.handler('No data directory provided', { code: 'BAJO_DATA_DIR_NOT_PROVIDED' })
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
  if (_.isString(config.log.details)) config.log.details = _.map((argv.root['log-details'] || '').split(','), t => _.trim(t))
  if (config.env === 'dev') config.log.level = 'debug'
  if (config.verbose) config.log.level = 'trace'

  if (!config.bajos.includes('app')) config.bajos.push('app')
  config.bajos = _.filter(_.uniq(_.map(config.bajos, b => _.trim(b))), b => !_.isEmpty(b))
  this.bajo.config = config
}

export default buildConfig
