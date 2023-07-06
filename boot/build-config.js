/**
 * @module boot/buildConfig
 */

import os from 'os'
import fs from 'fs-extra'
import _ from 'lodash'
import pathResolve from './helper/path-resolve.js'
import readConfig from './helper/read-config.js'
import getKeyByValue from './helper/get-key-by-value.js'
import envs from './helper/envs.js'
import defaultsDeep from './helper/defaults-deep.js'
import parseArgsArgv from './lib/parse-args-argv.js'
import parseEnv from './lib/parse-env.js'
import error from './helper/error.js'
import importPackage from './helper/import-package.js'

const defConfig = {
  dir: {},
  log: {
    dateFormat: 'YYYY-MM-DDTHH:MM:ss.SSS[Z]',
    report: [],
    tool: false
  },
  plugins: ['app'],
  env: 'dev',
  run: {
    tool: false,
    exitHandler: true
  }
}

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
 * If app run tool, by default log is in silent. To activate, set log.tool to true
 *
 * By default, if 'app' is a bajo app, it is always the last plugins to boot. To overide this
 * behavior, you should configure it at plugin level (i.e. using .bootorder file)
 *
 * @instance
 * @async
 * @throws Will throw if data directory is not provided
 *
 * @returns {Object} config
 */

async function buildConfig (cwd) {
  const { args, argv } = await parseArgsArgv()
  const env = parseEnv()
  const envArgv = defaultsDeep({}, env.root, argv.root)
  // directories
  _.set(envArgv, 'dir.base', pathResolve(cwd))
  if (!_.get(envArgv, 'dir.data')) _.set(envArgv, 'dir.data', `${envArgv.dir.base}/data`)
  envArgv.dir.data = pathResolve(envArgv.dir.data)
  if (!envArgv.dir.tmp) {
    envArgv.dir.tmp = pathResolve(os.tmpdir()) + '/bajo'
    fs.ensureDirSync(envArgv.dir.tmp)
  }
  // config merging
  const resp = _.omit(await readConfig.call(this, `${envArgv.dir.data}/config/bajo.*`, { ignoreError: true }), ['dir'])
  const config = defaultsDeep({}, envArgv, resp, defConfig)
  // force init
  config.args = args
  config.env = config.env.toLowerCase()
  if (_.values(envs).includes(config.env)) config.env = getKeyByValue(envs, config.env)
  if (!_.keys(envs).includes(config.env)) config.env = 'dev'
  process.env.NODE_ENV = envs[config.env]
  if (!config.log.level) config.log.level = config.env === 'dev' ? 'debug' : 'info'
  // sanitize plugins
  config.plugins = _.without(config.plugins, 'app')
  if (fs.existsSync(`${config.dir.base}/app/bajo`)) config.plugins.push('app')
  config.plugins = _.filter(_.uniq(_.map(config.plugins, b => _.trim(b))), b => !_.isEmpty(b))
  if (config.run.tool) {
    if (!config.plugins.includes('bajo-cli')) throw error(`Running tool require to have 'bajo-cli'`)
    if (!config.log.tool) config.log.level = 'silent'
    const ora = await importPackage('ora::bajo-cli')
    ora('Running tool').succeed()
  }
  this.bajo.config = config
}

export default buildConfig
